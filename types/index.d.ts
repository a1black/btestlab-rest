// TypeScript Version: 4.3
import express = require("express");
import http = require("http");

export = Bootstrap;

declare function Bootstrap(): Promise<[express.Application, () => http.Server]>;
