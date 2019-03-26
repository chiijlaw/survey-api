"use strict";
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const port = 3000;
const surveysDir = path.join(__dirname, "surveys");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ info: "Simple Survey API with Node" });
});

// ----------- Get list of all surveys ------------
app.get("/api/surveys", (req, res) => {
  fs.promises
    .readdir(surveysDir)
    .then(surveys => {
      res.status(200).send(surveys);
    })
    .catch(err => {
      console.log(err);
      res.sendStatus(404);
    });
});

// ----------- Get survey by name ------------
app.get("/api/surveys/:surveyName", (req, res) => {
  const surveyName = req.params.surveyName;
  fs.promises
    .readFile(path.join(surveysDir, `${surveyName}.json`), "utf8")
    .then(survey => {
      res.status(200).send(survey);
    })
    .catch(err => {
      console.log(err);
      res.sendStatus(404);
    });
});

// ----------- Create a survey ------------
app.post("/api/surveys/:surveyName", (req, res) => {
  const surveyName = req.params.surveyName;
  const destination = path.join(surveysDir, `${surveyName}.json`);
  // If survey already exists, send back error
  if (fs.existsSync(destination)) {
    res.status(405).send(`A survey named ${surveyName} already exists`);
  } else {
    const { name, questions, answers } = req.body;
    if (
      // Validate survey
      // Structure of a valid request body
      // {
      //   "name": String,
      //   "questions": String [],
      //   "answers": Object []
      // }
      // answers should also be empty
      typeof name !== "string" ||
      !Array.isArray(questions) ||
      !Array.isArray(answers) ||
      answers.length > 0
    ) {
      res.sendStatus(400);
    } else {
      fs.promises
        .writeFile(destination, JSON.stringify(req.body))
        .then(() => {
          res.sendStatus(201);
        })
        .catch(err => {
          console.log(err);
          res.sendStatus(400);
        });
    }
  }
});

// ---------------- Update answers in a survey ----------------------
app.patch("/api/surveys/:surveyName", (req, res) => {
  const surveyName = req.params.surveyName;
  const destination = path.join(surveysDir, `${surveyName}.json`);
  // If survey doesn't exists, send back error
  if (!fs.existsSync(destination)) {
    res.status(404).send(`A survey named ${surveyName} not found`);
  } else {
    const { response } = req.body;
    if (
      // Validate response
      // Structure of a valid request body
      // {
      //   "response": bool []
      // }
      !Array.isArray(response)
    ) {
      res.sendStatus(400);
    } else {
      fs.promises
        .readFile(destination, "utf8")
        .then(file => {
          let survey = JSON.parse(file);
          for (let i = 0; i < survey.answers.length; i += 1) {
            // Init records object if this is the first time
            if (!survey.answers[i]) {
              survey.answers[i] = { true: 0, false: 0 };
            }
            // Record answers
            const tally = survey.answers[i];
            if (response[i]) {
              tally.true = tally.true + 1;
            } else {
              tally.false = tally.false + 1;
            }
          }
          return fs.promises.writeFile(destination, JSON.stringify(survey));
        })
        .then(() => {
          res.sendStatus(200);
        })
        .catch(err => {
          console.log(err);
          res.sendStatus(400);
        });
    }
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
