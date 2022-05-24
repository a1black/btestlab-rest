import bootstrap = require("btestlab-rest");

bootstrap().then((value) => {
  const [app, startup] = value;
  app.listen();
  startup();
});
