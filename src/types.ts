/**
 * Utility type that represents a javascript object used as an dictionary.
 */
export type KeyedAnyObject = { [key: string]: any };

/**
 * Represents any valid typescript constructor.
 */
export type AbstractConstructor<T> = Function & { prototype: T };

/**
 * Represents the constructor type returned by a Based call.
 * This contains all the static definitions for the type.
 * <T>: The resulting type, which extends {@link Basie}.
 */
export type BasieClassType<T extends Basie> = {
    new(...args: any[]): T;
    /**
     * Private helper function that generates an instance of the instance type
     * from the specified sqlite results. This will also fetch any @children fields.
     */
    materialize(object: KeyedAnyObject): Promise<T>;

    /**
     * Creates the table, if it does not yet exist. This is a no-op otherwise.
     * This only works if decorator metadata is enabled, and throws otherwise.
     */
    createTable(): Promise<void>;
    /**
     * Drops the table, if it exists.
     */
    dropTable(): Promise<void>;

    /**
     * Finds the T instance with the specified ID, or undefined if it doesn't exist.
     */
    find(id: number): Promise<T | undefined>;
    /**
     * Finds the first T instance, or undefined if it doesn't exist.
     */
    first(): Promise<T | undefined>;
    /**
     * Finds all T instances in the database. Returns an empty array if there are none.
     */
    all(): Promise<T[]>;

    /**
     * Finds the first T instance that matches the specified params as a WHERE clause.
     * undefined is returned when there were no matches in the database. Note that the
     * value in the database are compared using =, so wildcards in strings are not supported.
     * 
     * @example
     * // Model has `age: number;` and `name: string;`.
     * User.findBy({ age: 10 }) // first user with age 10.
     * User.findBy({ age: 20, name: "John" }) // first user with both age 20 and name John
     * User.findBy({ name: "John%" }) // first user whose name is "John%" (no wildcards!)
     */
    findBy(params: Partial<T>): Promise<T | undefined>;

    /**
     * Acts the same as {@link findBy}, but returns all matching documents instead of
     * only the first. If only a single document is needed, findBy should be preferred.
     */
    where(params: Partial<T>): Promise<T[]>;

    /**
     * Finds all documents where the specified literal WHERE clause matches. Placeholders in
     * the form of `?` can be used to perform escaping. The wildcards will be substituted by
     * the arguments.
     * 
     * @example
     * // Model has `age: number;` and `name: string;`.
     * User.where("name LIKE ? AND age = 20", "%" + searchTerm + "%") // finds all users of age 20 whose name contains `searchTerm`.
     */
    where(query: string, ...args: any[]): Promise<T[]>;
};

/**
 * Abstract representation of the instance methods and properties added by Basie.
 */
export abstract class Basie {
    /**
     * The id of this document. This is undefined if the document is not saved,
     * and any attempted writes will throw.
     */
    readonly id: number;
    /**
     * Internal property used to store sqlite results.
     */
    readonly __props: KeyedAnyObject;
    /**
     * Internal property used to trap access to the object if it was deleted.
     */
    __poisoned: boolean;

    /**
     * Saves the current document, updating it if it already existed, or inserting
     * it otherwise. `id` is guaranteed to be valid after this call succeeds. This
     * operation will throw if any of the properties is null or undefined.
     */
    abstract save(): Promise<void>;
    /**
     * Destroys the current document, if it existed (no-op otherwise). This operation
     * will "poison" the object, causing any further access to the object to throw.
     * This is done to prevent users from accidentally modifying deleted objects.
     */
    abstract destroy(): Promise<void>;
};

/**
 * Alias for {@link BasieClassType}.
 */
export type B<T extends Basie> = BasieClassType<T>;

/**
 * Represents field metadata generated by @{@link field}. This metadata is stored
 * in the prototype (see {@link BasiePrototype}), and used in the Based call to
 * determine and use the fields declared in the base class.
 */
export interface FieldMetadata {
    columnName: string;
    fieldName: string;
    fieldType?: Function;
}

/**
 * Represents metadata generated by @{@link children}. This metadata is stored in
 * the prototype (see {@link BasiePrototype}) and is used in the BasieClassType.materialize
 * call to load additional children (recursively if neccessary).
 */
export interface ChildFieldMetadata {
    foreignType: (a: any) => B<any>;
    foreignKey?: string;
    fieldName: string;
}

/**
 * Represents all properties added to a Templates prototype. These properties
 * are used by @{@link field} and @{@link children} to store metadata about the annotated fields.
 */
export interface BasiePrototype {
    __basieFields?: FieldMetadata[];
    __basieChildFields?: ChildFieldMetadata[];
}