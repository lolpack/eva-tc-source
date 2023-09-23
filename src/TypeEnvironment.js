/**
 * Typed Eva: static typecheker.
 *
 * (C) 2022-present Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 */

/**
 * TypeEnvironment aka Γ (Gamma): mapping from names to types.
 */
class TypeEnvironment {
  /**
   * Creates an environment with the given record.
   */
  constructor(record = {}, parent = null) {
    this.record = record;
    this.parent = parent;
  }

  /**
   * Creates a variable with the given name and a type.
   */
  define(name, type_) {
    this.record[name] = type_;
    return type_;
  }

  /**
   * Returns the type of a defined variable, or throws
   * if the variable is not defined.
   */
  lookup(name) {
    if (!this.record.hasOwnProperty(name)) {
      throw new ReferenceError(`Vairable "${name} is not defined.`);
    }
    return this.record[name];
    
    //return this.resolve(name).record[name];
  }

  /**
   * Returns specific environment in which a variable is defined, or
   * throws if a variable is not defined.
   */
  resolve(name) {

  }
}

module.exports = TypeEnvironment;