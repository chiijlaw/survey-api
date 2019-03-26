"use strict";
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const yn = require("yn");

// ------------ Init terminal interface ---------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// --------------- Utility functions -----------------

// Create path to surveys folder
const getSurveysDir = () => {
  return path.join(__dirname, "surveys");
};

const promisifyQuestion = msg => {
  return new Promise((resolve, reject) => {
    rl.question(msg, resolve);
  });
};

// Get survey path from user input
const getTargetSurvey = async str => {
  const surveyDir = getSurveysDir();
  // Show all available surveys
  const surveys = await fs.promises.readdir(surveyDir);
  const name = await promisifyQuestion(
    `Which of these surveys would you like to ${str}?\n${surveys}\n`
  );
  const target = path.join(surveyDir, name);
  // Check to see if chosen survey exists. If it doesn't
  // then go straight to catch block
  await fs.promises.access(target, fs.constants.R_OK | fs.constants.W_OK);
  return target;
};

// --------------------- start prompt -----------------------
rl.setPrompt("SurveyHome>");
rl.prompt();
// Welcome message
console.log(`\nHello!\nWelcome to an anonymous survey CLI.\n`);

// --------------------- Main Menu -----------------------
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
          // Move user to create section
          create();
          break;
        case "2":
          rl.setPrompt("Survey Take>");
          rl.prompt();
          // Move user to take section
          take();
          break;
        case "3":
          rl.setPrompt("Survey Results>");
          rl.prompt();
          // Move user to get results section
          getResults();
          break;
        default:
          // Invalid input. Show them the main menu again.
          console.log(`I'm sorry, ${line} is not an option.\n`);
          rl.prompt();
          home();
          break;
      }
    }
  );
};

// --------------------- Create a survey -----------------------
const create = async () => {
  try {
    const survey = { name: "none", questions: [], answers: [] };
    let count = 1;
    let recur = true;
    // Set survey name
    survey.name = await promisifyQuestion("What is the name of the survey?\n");
    // Set path of where to save the survey
    const destination = path.join(getSurveysDir(), `${survey.name}.json`);
    // Check if file already exists
    if (fs.existsSync(destination)) {
      if (
        // If it already exists, ask them if they want to overwrite it
        !yn(
          await promisifyQuestion(
            `Survey ${survey.name} already exists! Overwrite? (y/n)\n`
          )
        )
        // If they say no to overwriting it, then take them back to the main menu.
      ) {
        console.log("Returning to main menu.\n");
        home();
      }
    }
    // Allow them to continously register questions until they type end
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
    // Save the survey onto the disk as a json file
    await fs.promises.writeFile(destination, JSON.stringify(survey));
    home();
  } catch (e) {
    // catch errors
    console.log(e);
  }
};

// --------------------- Take a survey -----------------------
const take = async () => {
  try {
    const target = await getTargetSurvey("take?");
    // Retrieve survey
    let survey = JSON.parse(await fs.promises.readFile(target, "utf8"));
    // Ask survey questions
    for (let i = 0; i < survey.questions.length; i += 1) {
      let answer = yn(await promisifyQuestion(`${survey.questions[i]}\n`));
      // Init records object if this is the first time
      if (!survey.answers[i]) {
        survey.answers[i] = { true: 0, false: 0 };
      }
      // Record answers
      const tally = survey.answers[i];
      if (answer) {
        tally.true = tally.true + 1;
      } else {
        tally.false = tally.false + 1;
      }
    }
    // Update update records on disk
    await fs.promises.writeFile(target, JSON.stringify(survey));
    console.log(`Thank you for taking the survey! Returning to main menu.`);
    home();
  } catch (e) {
    // If there is an error, log and return them to the top of the take section.
    console.log(e);
    take();
  }
};

// --------------------- Get survey results -----------------------
const getResults = async () => {
  try {
    const target = await getTargetSurvey("get results from?");
    // Retrieve survey
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

// Start user off at main menu
home();
