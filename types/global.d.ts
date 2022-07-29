import express = require("express");
import http = require("http");
import jwt = require("jsonwebtoken");
import mongodb = require("mongodb");
import pino = require("pino");

declare global {
  // Typescript template literal types
  type Cons<H, T> = T extends readonly any[]
    ? ((h: H, ...t: T) => void) extends (...r: infer R) => void
      ? R
      : never
    : never;

  interface Dict<T = any> {
    [key: string]: T;
  }

  type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

  type Join<T extends unknown[], D extends string> = T extends []
    ? ""
    : T extends [string | number | boolean | bigint]
    ? `${T[0]}`
    : T extends [string | number | boolean | bigint, ...infer U]
    ? `${T[0]}${D}${Join<U, D>}`
    : string;

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

  // Application specific types
  type Application = [express.Application, () => http.Server];

  interface ApplicationContext {
    client: mongodb.MongoClient;
    db: mongodb.Db;
    logger: pino.Logger;
  }

  interface Configuration {
    accessToken: {
      adminKey: string;
      algorithm: jwt.Algorithm;
      issuer: string;
      secret: string;
      ttl: number;
    };
    db: {
      dbname: string;
      uri: string;
    };
    general: {
      employeeNameCapitalize: RegExp;
      passwdHashSize: number;
    };
    genops: {
      employee: {
        codeLength: number;
        codePrefix: number;
      };
    };
    input: {
      contingent: any;
      employee: any;
    };
    server: {
      env: string;
      host?: string;
      logLevel?: string;
      port?: number;
    };
  }

  namespace Collection {
    type OmitBase<T extends BaseDocument> = Omit<T, keyof BaseDocument>;

    interface BaseDocument {
      _id: any;
      /** Document creation date. */
      ctime: Date;
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
  }

  namespace Express {
    interface Request {
      /** Method for fetching configuration values. */
      config: (
        path: Join<Paths<Omit<Configuration, "db" | "server">>, ".">,
        _default?: any
      ) => any;
      /** Application global state. */
      context: ApplicationContext;
      /** Verify internal network request. */
      isInternal: () => boolean;
    }
  }
}
