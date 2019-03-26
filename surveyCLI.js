"use strict";
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const yn = require("yn");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.setPrompt("SurveyHome>");
rl.prompt();
console.log(`\nHello!\nWelcome to an anonymous survey CLI.\n`);

function promisifyQuestion(msg) {
  return new Promise((resolve, reject) => {
    rl.question(msg, resolve);
  });
}

const home = () => {
  rl.question(
    `What would you like to do?\n1. Create a survey.\n2. Take a survey.\n3. Get results of a survey.
  (1/2/3)\n`,
    input => {
      const line = input.trim();
      switch (line) {
        case "1":
          rl.setPrompt("Survey Create>");
          rl.prompt();
          create();
          break;
        case "2":
          rl.setPrompt("Survey Take>");
          rl.prompt();
          take();
          break;
        case "3":
          rl.setPrompt("Survey Results>");
          rl.prompt();
          getResults();
          break;
        default:
          console.log(`I'm sorry, ${line} is not an option.\n`);
          rl.prompt();
          home();
          break;
      }
    }
  );
};

const create = async () => {
  try {
    const survey = { name: "none", questions: [], answers: [] };
    let count = 1;
    let recur = true;
    survey.name = await promisifyQuestion("What is the name of the survey?\n");
    const destination = path.join(__dirname, "surveys", `${survey.name}.js`);
    if (fs.existsSync(destination)) {
      if (
        !yn(
          await promisifyQuestion(
            `Survey ${survey.name} already exists! Overwrite? (y/n)\n`
          )
        )
      ) {
        console.log("Returning to main menu.\n");
        home();
      }
    }
    while (recur) {
      let question = await promisifyQuestion(
        `Please input question #${count} or type end to finish\n`
      );
      if (question === "end") {
        recur = false;
      } else {
        count += 1;
        survey.questions.push(question);
      }
    }
    await fs.promises.writeFile(destination, JSON.stringify(survey));
    home();
  } catch (e) {
    console.log(e);
  }
};

const take = async () => {
  try {
    let surveyDir = path.join(__dirname, "surveys");
    let surveys = await fs.promises.readdir(surveyDir);
    console.log("Which of these surveys would you like to take?\n", surveys);
    let name = await promisifyQuestion(
      "What survey would you like to take? (omit .js)\n"
    );
    let target = path.join(surveyDir, `${name}.js`);
    await fs.promises.access(target, fs.constants.R_OK | fs.constants.W_OK);
    let survey = JSON.parse(await fs.promises.readFile(target, "utf8"));
    for (let i = 0; i < survey.questions.length; i += 1) {
      let answer = yn(await promisifyQuestion(`${survey.questions[i]}\n`));
      if (!survey.answers[i]) {
        survey.answers[i] = { true: 0, false: 0 };
      }
      const tally = survey.answers[i];
      if (answer) {
        tally.true = tally.true + 1;
      } else {
        tally.false = tally.false + 1;
      }
    }
    await fs.promises.writeFile(target, JSON.stringify(survey));
    console.log(`Thank you for taking the survey! Returning to main menu.`);
    home();
  } catch (e) {
    console.log(e);
    take();
  }
};

const getResults = async () => {
  try {
    let surveyDir = path.join(__dirname, "surveys");
    let surveys = await fs.promises.readdir(surveyDir);
    console.log(
      "Which of these surveys would you like the results from?\n",
      surveys
    );
    let name = await promisifyQuestion(
      "What survey would you like to analyze? (omit .js)\n"
    );
    let target = path.join(surveyDir, `${name}.js`);
    await fs.promises.access(target, fs.constants.R_OK | fs.constants.W_OK);
    let survey = JSON.parse(await fs.promises.readFile(target, "utf8"));
    for (let i = 0; i < survey.questions.length; i += 1) {
      let ans = survey.answers[i];
      console.log(
        `${survey.questions[i]}:\n true/yes: ${ans.true}\n false/no: ${
          ans.false
        }\n`
      );
    }
    console.log("Returning to main menu.");
    home();
  } catch (e) {
    console.log(e);
    home();
  }
};

home();
