import express = require("express");
import http = require("http");
import jwt = require("jsonwebtoken");
import mongodb = require("mongodb");
import pino = require("pino");

declare global {
  type Application = [express.Application, () => http.Server];

  interface ApplicationContext {
    client: mongodb.MongoClient;
    config: Omit<Configuration, "db" | "server">;
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
    genops: {
      employeeCode: {
        length: number;
        prefix: string;
      };
    };
    input: {
      employee: any;
    };
    server: {
      env: string;
      host?: string;
      logLevel?: string;
      port?: number;
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
  }

  namespace Express {
    interface Request {
      context: ApplicationContext;
      globals: {
        CollectionNameEnum: Globals.CollectionNameEnum;
      };
      isInternal: () => boolean;
    }
  }
}
