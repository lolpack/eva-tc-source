/**
 * Typed Eva: static typecheker.
 *
 * (C) 2022-present Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 */

const Type = require('./Type');
const TypeEnvironment = require('./TypeEnvironment');

/**
 * Typed Eva: static typecheker.
 */
class EvaTC {
  /**
   * Creates an Eva instance with the global environment.
   */
  constructor() {
    /**
     * Create the Global TypeEnvironment per Eva instance.
     */
    this.global = this._createGlobal();
  }

  /**
   * Evaluates global code wrapping into a block.
   */
  tcGlobal(exp) {
    return this._tcBody(exp, this.global);
  }

  /**
   * Checks body (global or function).
   */
  _tcBody(body, env) {
    if (body[0] === 'begin') {
      return this._tcBlock(body, env);
    }
    return this.tc(body, env);
  }

  /**
   * Infers and validates type of an expression.
   */
  tc(exp, env = this.global) {
    // --------------------------------------------
    // Self-evaluating:

    /**
     * Numbers: 10
     */
    if (this._isNumber(exp)) {
      return Type.number;
    }

    /**
     * Strings: "hellow"
     */
    if (this._isString(exp)) {
      return Type.string;
    }

    // --------------------------------------------
    // Boolean: true | false

    if (this._isBoolean(exp)) {
      return Type.boolean;
    }

    // --------------------------------------------
    // Math operations:

    if (this._isBinary(exp)) {
      return this._binary(exp, env);
    }

    // --------------------------------------------
    // Boolean binary:

    if (this._isBooleanBinary(exp)) {
      return this._booleanBinary(exp);
    }

    // --------------------------------------------
    // Type declaration/alias: (type <name> <base>)

    if (exp[0] === 'type') {
      /* Implement here */
    }

    // --------------------------------------------
    // Class declaration: (class <Name> <Super> <Body>)

    if (exp[0] === 'class') {
      /* Implement here */
    }

    // --------------------------------------------
    // Class instantiation: (new <Class> <Arguments>...)

    if (exp[0] === 'new') {
      /* Implement here */
    }

    // --------------------------------------------
    // Super expressions: (super <ClassName>)

    if (exp[0] === 'super') {
      /* Implement here */
    }

    // --------------------------------------------
    // Property access: (prop <instance> <name>)

    if (exp[0] === 'prop') {
      /* Implement here */
    }

    // --------------------------------------------
    // Variable declaration: (var x 10)
    //
    // With typecheck: (var (x number) "foo") // error

    if (exp[0] === 'var') {
      const [_tag, name, value] = exp;

      // Infer actual type:
      const valueType = this.tc(value, env);

      // With type check:
      if (Array.isArray(name)) {
        const [varName, typeStr] = name;

        const expectedType = Type.fromString(typeStr);

        // Check the type:
        this._expect(valueType, expectedType, value, exp);

        return env.define(varName, expectedType);
      }

      return env.define(name, valueType);
    }

    // --------------------------------------------
    // Variable access: foo

    if (this._isVariableName(exp)) {
      return env.lookup(exp);
    }

    // --------------------------------------------
    // Variable update: (set x 10)

    if (exp[0] === 'set') {
      const [_, ref, value] = exp;

      // The type of the new value should match to the
      // previous type when the variable was defined

      const valueType = this.tc(value, env);
      const varType = this.tc(ref, env);

      return this._expect(valueType, varType, value, exp);
    }

    // --------------------------------------------
    // Block: sequence of expressions

    if (exp[0] === 'begin') {
      const blockEnv = new TypeEnvironment({}, env);
      return this._tcBlock(exp, blockEnv);
    }

    // --------------------------------------------
    // if-expression:
    //
    //    Γ ⊢ e1 : boolean  Γ ⊢ e2 : t  Γ ⊢ e3 : t
    //   ___________________________________________
    //
    //           Γ ⊢ (if e1 e2 e3) : t
    //
    // Both branches should return the same time t.
    //

    if (exp[0] === 'if') {
      const [_tag, condition, consequent, alternate] = exp;

      // Boolean condition
      const t1 = this.tc(condition, env);
      this._expect(t1, Type.boolean, condition, exp);

      const t2 = this.tc(consequent, env);
      const t3 = this.tc(alternate, env);

      //Same type for both branches
      return this._expect(t3, t2, exp, exp);
    }

    // --------------------------------------------
    // while-expression:

    if (exp[0] === 'while') {
      const [_tag, condition, body] = exp;

      // Boolean condition
      const t1 = this.tc(condition, env);
      this._expect(t1, Type.boolean, condition, exp);

      return this.tc(body, env);
    }

    // --------------------------------------------
    // Function declaration: (def square ((x number)) -> number (* x x))
    //
    // Syntactic sugar for: (var square (lambda ((x number)) -> number (* x x)))

    if (exp[0] === 'def') {
      const [_tag, name, params, _retDel, returnTypeStr, body] = exp;

      // Extend environment with function name before evaluating body
      // to support recursive function

      const paramTypes = params.map(([name, typeStr]) => 
        Type.fromString(typeStr)
      );

      env.define(
        name,
        new Type.Function({
          paramTypes,
          returnType: Type.fromString(returnTypeStr)
        }),
      );

      // Validate body
      return this._tcFunction(params, returnTypeStr, body, env);
    }
      // ------------------------------------------
      // Function calls
      // (square 2)

    if (Array.isArray(exp)) {
      const fn = this.tc(exp[0], env);
      const argValues = exp.slice(1);

      // Passed arguments
      const argTypes = argValues.map(arg => this.tc(arg, env));

      return this._checkFunctionCall(fn, argTypes, env, exp);
    }

    // --------------------------------------------
    // Lambda function: (lambda ((x number)) -> number (* x x))

    if (exp[0] === 'lambda') {
      /* Implement here */
    }

    // --------------------------------------------
    // Function calls.
    //
    // (square 2)

    if (Array.isArray(exp)) {
      /* Implement here */
    }

    throw `Unknown type for expression ${exp}.`;
  }

  /**
   * Maps generic parameter types to actual types.
   */
  _getGenericTypesMap(genericTypes, actualType) {
    const boundTypes = new Map();
    for (let i = 0; i < genericTypes.length; i++) {
      boundTypes.set(genericTypes[i], actualType[i]);
    }
    return boundTypes;
  }

  /**
   * Binds generic parameters and return type to actual types.
   */
  _bindFunctionTypes(params, returnType, genericTypesMap) {
    /* Implement here */
  }

  /**
   * Extracts types for generic parameter types.
   *
   * (combine <string> "hello")
   */
  _extractActulCallTypes(exp) {
    const data = /^<([^>]+)>$/.exec(exp[1]);

    if (data == null) {
      throw `No actual types provided in generic call: ${exp}.`;
    }

    return data[1].split(',');
  }

  /**
   * Simple function declarations (no generic parameters).
   *
   * Such functions are type-checked during declaration time.
   */
  _createSimpleFunctionType(exp, env) {
    /* Implement here */
  }

  /**
   * Generic function declarations.
   *
   * Such functions are *not* checked at declaration,
   * instead they are checked at call time, when all
   * generic parameters are bound.
   */
  _createGenericFunctionType(exp, env) {
    /* Implement here */
  }

  /**
   * Whether the function is generic.
   *
   * (lambda <K> ((x K)) -> K (+ x x))
   */
  _isGenericLambdaFunction(exp) {
    /* Implement here */
  }

  /**
   * Whether the function is generic.
   *
   * (def foo <K> ((x K)) -> K (+ x x))
   */
  _isGenericDefFunction(exp) {
    return exp.length === 7 && /^<[^>]+>$/.test(exp[2]);
  }

  /**
   * Transforms def to var-lambda.
   */
  _transformDefToVarLambda(exp) {
    /* Implement here */
  }

  /**
   * Whether the if-condition is type casting/specification.
   *
   * This is used with union types to make a type concrete:
   *
   * (if (== (typeof foo) "string") ...)
   *
   */
  _isTypeCastCondition(condition) {
    const [op, lhs] = condition;
    return op === '==' && lhs[0] === 'typeof';
  }

  /**
   * Returns specific type after casting.
   *
   * This is used with union types to make a type concrete:
   *
   * (if (== (typeof foo) "string") ...)
   *
   */
  _getSpecifiedType(condition) {
    /* Implement here */
  }

  /**
   * Checks function call.
   */
  _checkFunctionCall(fn, argTypes, env, exp) {
    // Check arity
    if (fn.paramTypes.length !== argTypes.length) {
      throw `\nFunction ${exp[0]} ${fn.getName()} expects ${
        fn.paramTypes.length
      } arguments, ${argTypes.length} given in ${exp}.\n`
    }

    // Check if argument types match the parameter types:
    argTypes.forEach((argType, index) => {
      this._expect(argType, fn.paramTypes[index], argTypes[index], exp);
    });

    return fn.returnType;
  }

  /**
   * Checks function body.
   */
  _tcFunction(params, returnTypeStr, body, env) {
    const returnType = Type.Function.fromString(returnTypeStr);

    // Parameters environment and types:
    const paramsRecord = {};
    const paramTypes = [];

    params.forEach(([name, typeStr]) => {
      const paramType = Type.fromString(typeStr);
      paramsRecord[name] = paramType;
      paramTypes.push(paramType);
    });
    const fnEnv = new TypeEnvironment(paramsRecord, env);

    // Check the body in the extended environment:
    const actualReturnType = this._tcBody(body, fnEnv);

    // Check return type:
    if (!returnType.equals(actualReturnType)) {
      throw `Expected function ${body} to return ${returnType}, but got ${actualReturnType}.`
    }

    // Function type records its parameters and return type,
    // so we can use them to validate function calls:
    return new Type.Function({
      paramTypes,
      returnType
    });
  }

  /**
   * Checks a block.
   */
  _tcBlock(block, env) {
    let result;

    const [_tag, ...expressions] = block;

    expressions.forEach(exp => {
      result = this.tc(exp, env);
    });

    return result;
  }

  /**
   * Whether the expression is a variable name.
   */
  _isVariableName(exp) {
    return typeof exp === 'string' && /^[+\-*/<>=a-zA-Z0-9_:]+$/.test(exp);
  }

  /**
   * Creates a Global TypeEnvironment.
   */
  _createGlobal() {
    return new TypeEnvironment({
      VERSION: Type.string,

      sum: Type.Function.fromString('Fn<number<number,number>>'),
      square: Type.Function.fromString('Fn<number<number>>'),
      typeof: Type.Function.fromString('Fn<string<any>>'),
    });
  }

  /**
   * Whether the expression is boolean binary.
   */
  _isBooleanBinary(exp) {
    return (
      exp[0] === '==' ||
      exp[0] === '!=' ||
      exp[0] === '>=' ||
      exp[0] === '<=' ||
      exp[0] === '>' ||
      exp[0] === '<'
    );
  }

  /**
   * Boolean binary operators.
   */
  _booleanBinary(exp, env) {
    this._checkArity(exp, 2);

    const t1 = this.tc(exp[1], env);
    const t2 = this.tc(exp[2], env);

    this._expect(t2, t1, exp[2], exp);

    return Type.boolean;
  }

  /**
   * Whether the expression is binary.
   */
  _isBinary(exp) {
    return /^[+\-*/]$/.test(exp[0]);
  }

  /**
   * Binary operators.
   */
  _binary(exp, env) {
    this._checkArity(exp, 2);

    const t1 = this.tc(exp[1], env);
    const t2 = this.tc(exp[2], env);

    return this._expect(t2, t1, exp[2], exp);
  }

  /**
   * Returns allowed operand types for an operator.
   */
  _getOperandTypesForOperator(operator) {
    switch (operator) {
      case '+':
        return [Type.string, Type.number];
      case '-':
        return [Type.number];
      case '/':
        return [Type.number];
      case '*':
        return [Type.number];
      default:
        throw `Unknown operator: ${operator}.`;
    }
  }

  /**
   * Throws if operator type doesn't expect the operand.
   */
  _expectOperatorType(type_, allowedTypes, exp) {
    if (!allowedTypes.some(t => t.equals(type_))) {
      throw `\nUnexpected type: ${type} in ${exp}, allowed: ${allowedTypes}`;
    }
  }

  /**
   * Expects a type.
   */
  _expect(actualType, expectedType, value, exp) {
    if (!actualType.equals(expectedType)) {
      this._throw(actualType, expectedType, value, exp);
    }
    return actualType;
  }

  /**
   * Throws type error.
   */
  _throw(actualType, expectedType, value, exp) {
    throw `\nExpected "${expectedType}" type for ${value} in ${JSON.stringify(exp)}, but got "${actualType}" type.\n`;
  }

  /**
   * Throws for number of arguments.
   */
  _checkArity(exp, arity) {
    if (exp.length - 1 !== arity) {
      throw `\nOperator '${exp[0]}' expects ${arity} operands, ${exp.length -
        1} given in ${exp}.\n`;
    }
  }

  /**
   * Whether the expression is a boolean.
   */
  _isBoolean(exp) {
    return typeof exp === 'boolean' || exp === 'true' || exp === 'false';
  }

  /**
   * Whether the expression is a number.
   */
  _isNumber(exp) {
    return typeof exp === 'number';
  }

  /**
   * Whether the expression is a string.
   */
  _isString(exp) {
    return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
  }
}

module.exports = EvaTC;