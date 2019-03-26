# survey-api

Nodejs API for taking a survey.

## Prerequisites

> This assumes you are using [npm](https://www.npmjs.com/) as your package manager.

- Node v10.11.0

## Install

Install dependencies by running:

```
npm install
```

> If you do not have nodemon installed globally, run:

```
npm install -d nodemon
```

## Run server

```
npm start
```

navigate to or send requests to localhost:3000.

## Run CLI

In project folder, run

```
node surveryCLI.js
```

exit CLI with Ctrl+C

### Data Persistence

This API was created by writing surveys to disk because no external database persistence was allowed. If I was allowed to use a database and surveys were no longer anonymous and needed to track respondents, I would use a postgres database, architected with this diagram https://dbdiagram.io/d/5c955a97f7c5bb70c72f60d8 (hover over to see relationships). Node servers would connect to this database. If there are multiple servers, they would be load balanced with Nginx or Amazon's load balancer. By horzontally scaling the Node servers, more servers can be spun up or down as load increases or decreases.
