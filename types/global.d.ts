import Polyglot = require("node-polyglot");
import express = require("express");
import http = require("http");
import jwt = require("jsonwebtoken");
import mongodb = require("mongodb");
import pino = require("pino");

declare global {
  type Cons<H, T> = T extends readonly any[]
    ? ((h: H, ...t: T) => void) extends (...r: infer R) => void
      ? R
      : never
    : never;
  type Dict<T = unknown> = Record<string, T>;
  /** Concatenates list of `T` using joiner string `D`. */
  type Join<T extends unknown[], D extends string> = T extends []
    ? ""
    : T extends [string | number | boolean | bigint]
    ? `${T[0]}`
    : T extends [string | number | boolean | bigint, ...infer U]
    ? `${T[0]}${D}${Join<U, D>}`
    : string;
  /** Travels object `T` to get value type at path `P` */
  type Leafs<T extends Dict, P extends string> = {
    [K in P]: K extends keyof T
      ? T[K]
      : K extends `${infer P}.${infer S}`
      ? T[P] extends Dict
        ? Leafs<T[P], S>
        : never
      : never;
  }[P];
  /** Builds list of traversable path in object `T` with max depth `D`. */
  type Paths<T, D extends number = 10> = [D] extends [never]
    ? never
    : T extends object
    ? {
        [K in keyof T]-?:
          | [K]
          | (Paths<T[K], Prev[D]> extends infer P
              ? P extends []
                ? never
                : Cons<K, P>
              : never);
      }[keyof T]
    : [];
  type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

  // Application specific types
  type ApplicationConfiguration = {
    accessToken: {
      algorithm: jwt.Algorithm;
      expiresIn: number;
      issuer: string;
      secret: Buffer;
    };
    general: {
      passwdHashSize: number;
    };
    genops: {
      employeeId: {
        length: number;
        prefix: number;
      };
      lpuId: {
        length: number;
        prefix: number;
      };
    };
    input: {
      auth: any;
      contingent: any;
      employee: any;
      lpu: any;
    };
  };
  type Configuration = ApplicationConfiguration & HttpServerConfiguration;
  type HttpServerConfiguration = {
    db: {
      dbname: string;
      uri: string;
    };
    server: {
      env: string;
      host?: string;
      logLevel?: string;
      port: number;
    };
  };
  type I18nFactoryFunction = (options?: Polyglot.PolyglotOptions) => Polyglot;

  interface ApplicationContext {
    client: mongodb.MongoClient;
    db: mongodb.Db;
  }

  interface Error {
    /** Object to send as a body of HTTP response. */
    response?: Dict<any>;
    /** If `true` allow user to see server error message, `false` shows default message. */
    expose?: boolean;
    /** Name of service that raised error. */
    serviceCode?: string;
    /** HTTP response status code. */
    status?: number;
    /** Alias for `status`. */
    statusCode?: number;
  }

  interface JwtPayload extends jwt.JwtPayload {
    admin?: boolean;
    firstname: string;
    lastname: string;
    sex: string;
  }

  interface User extends Collection.Employee {}

  namespace Collection {
    type InferIdType<T> = mongodb.InferIdType<T>;
    type OmitBase<T extends BaseDocument, K extends keyof T = never> = Omit<
      mongodb.WithoutId<T>,
      keyof BaseDocument | "_id" | K
    >;

    interface BaseDocument {
      /** Document creation date. */
      ctime: Date;
      /** Document removal date. */
      dtime?: Date;
      /** Document modification date. */
      mtime?: Date;
    }

    interface Contingent extends BaseDocument {
      code: string;
      desc?: string;
    }

    interface Employee extends BaseDocument {
      _id: number;
      admin?: boolean;
      birthdate: Date;
      firstname: string;
      lastname: string;
      middlename: string;
      password?: string;
      sex: string;
    }

    interface Lpu extends BaseDocument {
      _id: number;
      _hash: string;
      abbr: string;
      code?: number;
      name?: string;
      opf: string;
      xtime?: Date;
    }
  }

  namespace Express {
    interface Request {
      /** Json web token payload. */
      auth: JwtPayload;
      /** Method for fetching configuration values. */
      config: <K extends Join<Paths<ApplicationConfiguration>, ".">>(
        path: K,
        _default?: any
      ) => Leafs<ApplicationConfiguration, K>;
      /** Application global state. */
      context: ApplicationContext;
      /** Produces instance of intarnalization  */
      i18n: I18nFactoryFunction;
      /** Verify internal network request. */
      isInternal: () => boolean;
      /** Instance of message logger. */
      logger: pino.Logger;
      /** Database document of authenticated user. */
      user: Partial<User>;
    }

    interface Response {
      sendOk: (ok?: boolean) => this;
    }
  }
}
