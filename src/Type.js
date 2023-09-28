/**
 * Typed Eva: static typecheker.
 *
 * (C) 2022-present Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 */

const TypeEnvironment = require('./TypeEnvironment');

/**
 * Type class.
 */
class Type {
  constructor(name) {
    this.name = name;
  }

  /**
   * Returns name.
   */
  getName() {
    return this.name;
  }

  /**
   * String representation.
   */
  toString() {
    return this.getName();
  }

  /**
   * Equals.
   */
  equals(other) {
    if (other instanceof Type.Alias) {
      return other.equals(this);
    }

    if (other instanceof Type.Union) {
      return other.equals(this);
    }
    
    return this.name === other.name;
  }

  /**
   * From string: 'number' -> Type.number
   */
  static fromString(typeStr) {
    if (this.hasOwnProperty(typeStr)) {
      return this[typeStr];
    }

    if (typeStr.includes('Fn<')) {
      return Type.Function.fromString(typeStr);
    }

    throw `Unknown type: ${typeStr}`;
  }
}

/**
 * Number type.
 */
Type.number = new Type('number');

/**
 * String type.
 */
Type.string = new Type('string');

/**
 * Boolean type.
 */
Type.boolean = new Type('boolean');

/**
 * Null type.
 */
Type.null = new Type('null');

/**
 * Any type.
 */
Type.any = new Type('any');

/**
 * Function meta type.
 */
Type.Function = class extends Type {
  constructor({name = null, paramTypes, returnType}) {
    super(name)
    this.paramTypes = paramTypes;
    this.returnType = returnType;
    this.name = this.getName();
  }

  /**
   * Returns name: Fn<returnType<p1, p2, ...>>
   * 
   **/
  getName() {
    if (this.name == null) {
      const name = ['Fn<', this.returnType.getName()];
      // params.
      if (this.paramTypes.length !== 0) {
        const params = [];
        for (let i = 0; i < this.paramTypes.length; i++) {
          params.push(this.paramTypes[i].getName());
        }
        name.push('<', params.join(','), '>');
      }
      name.push('>');
    }
    return this.name;
  }

  /**
   * Equals.
   */
  equals(other) {
    if (this.paramTypes.length !== other.paramTypes.length) {
      return false;
    }

    for (let i = 0; i < this.paramTypes.length; i++) {
      if (!this.paramTypes[i].equals(other.paramTypes[i])) {
        return false
      }
    }

    if (!this.returnType.equals(other.returnType)) {
      return false;
    }

    return true;
  }

  static fromString(typeStr) {
    if (Type.hasOwnProperty(typeStr)) {
      return Type[typeStr];
    }

    // Function type with return and params
    let matched = /^Fn<(\w+)<([a-z,\s]+)>>$/.exec(typeStr);

    if (matched != null) {
      const [_, returnTypeStr, paramsString] = matched;

      // Param types
      const paramTypes = paramsString
        .split(/,\s*/g)
        .map(param => Type.fromString(param));

      return (Type[typeStr] = new Type.Function({
        name: typeStr,
        paramTypes,
        returnType: Type.fromString(returnTypeStr)
      }));
    }

    // function type with return type only
    matched = /^Fn<(\w+)>$/.exec(typeStr);

    if (matched != null) {
      const [_, returnTypeStr] = matched;
      return (Type[typeStr] = new Type.Function({
        name: typeStr,
        paramTypes: [],
        returnType: Type.fromString(returnTypeStr)
      }));
    }

    throw `Type.Function.fromString: Unknown type: ${typeStr}`;
  }
};

/**
 * Type alias: (type int number)
 */
Type.Alias = class extends Type {
  constructor({name, parent}) {
    super(name);
    this.parent = parent;
  }

  /**
   * Equals.
   */
  equals(other) {
    if (this.name === other.name) {
      return true;
    }

    return this.parent.equals(other);
  }
};

module.exports = Type;

/**
 * Class type: (class ...)
 *
 * Creates a new TypeEnvironment.
 */
Type.Class = class extends Type {
  constructor({name, superClass = Type.null}) {
    super(name);
    this.superClass = superClass;
    this.env = new TypeEnvironment({}, superClass != Type.null ? superClass.env : null);
  }

  // Return field type
  getField(name) {
    return this.env.lookup(name);
  }

  // Equals override
  equals(other) {
    if (this === other) {
      return true;
    }

    // Aliases:
    if (other instanceof Type.Alias) {
      return other.equals(this);
    }

    if (this.superClass != Type.null) {
      return this.superClass.equals(other);
    }

    return false;
  }
};

/**
 * Union type: (or string number)
 */
Type.Union = class extends Type {
  constructor({name, optionTypes}) {
    super(name);
    this.optionTypes = optionTypes;
  }

  /**
   * This union includes all types
   */
  includesAll(types) {
    if (types.length !== this.optionTypes.length) {
      return false;
    }
    for (const type_ of types) {
      if (!this.equals(type_)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Equals.
  */ 
  equals(other) {
    if (this === other) {
      return true;
    }

    // Aliases:
    if (other instanceof Type.Alias) {
      return other.equals(this);
    }

    // Other union:
    if (other instanceof Type.Union) {
      return this.includesAll(other.optionTypes);
    }

    // Anything else:
    return this.optionTypes.some(t => t.equals(other));
  }
};

/**
 * Generic function type.
 *
 * Generic functions create normal function types
 * when a function is called.
 */
Type.GenericFunction = class extends Type {
  /* Implement here */
};



















