import express = require("express");
import http = require("http");
import jwt = require("jsonwebtoken");
import mongodb = require("mongodb");
import pino = require("pino");

declare global {
  type Application = [express.Application, () => http.Server];

  interface ApplicationContext {
    client: mongodb.MongoClient;
    config: Omit<Configuration, "db" | "env" | "host" | "logLevel" | "port">;
    db: mongodb.Db;
    logger: pino.Logger;
  }

  interface Configuration {
    accessToken: {
      adminKey: string;
      algorithm: jwt.Algorithm;
      issuer: string;
      secret: Buffer;
      ttl: number;
    };
    db: {
      dbname: string;
      uri: string;
    };
    env: string;
    host: string;
    logLevel?: string;
    port: number;
    validation: {
      employee: {
        password: {
          maxLength: number;
          minLength: number;
        };
      };
    };
  }

  interface Dict<T = any> {
    [key: string]: T;
  }

  namespace Collection {
    interface Employee extends mongodb.Document {
      _id: string;
      _deleted: boolean;
      admin?: boolean;
      birthdate: Date;
      firstname: string;
      lastname: string;
      middlename: string;
      password?: string;
      sex: string;
    }
  }

  namespace Globals {
    interface CollectionNameEnum extends Iterable<string> {
      EMPLOYEE: string;
    }

    interface ConstantEnum extends Iterable<any> {
      PASSWORD_MIN_LENGTH: number;
    }
  }

  namespace Express {
    interface Request {
      context: ApplicationContext;
      globals: {
        CollectionNameEnum: Globals.CollectionNameEnum;
        ConstantEnum: Globals.ConstantEnum;
      };
      isInternal: () => boolean;
    }
  }
}
