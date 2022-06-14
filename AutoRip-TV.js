//All of the constants required throughout the script
const user = {};
const moment = require("moment");
const config = require("config");
const mkvDir = config.get("Path.mkvDir.Dir");
const movieRips = config.get("Path.movieRips.Dir");
const fileLog = config.get("Path.logToFiles.Enabled").toLowerCase();
const logDir = config.get("Path.logToFiles.Dir");
const eject = config.get("Path.ejectDVDs.Enabled").toLowerCase();
const makeMKV = `"${mkvDir}\\makemkvcon.exe"`;
const exec = require("child_process").exec;
const fs = require("fs");
const winEject = require("win-eject");
var goodVideoArray = [];
var badVideoArray = [];
colors = require("colors/safe");

//Color theme settings for colored text
colors.setTheme({
  info: "green",
  error: "red",
  time: "yellow",
  dash: "gray",
  title: "cyan",
  line1: ["white", "bgBlack"],
  line2: ["black", "bgWhite"],
  warning: ["white", "bgRed"],
});

// getCopyCompleteMSG();
Opener();
ripOrDip();

//Opening boilerplate
function Opener() {
  console.info(
    colors.line1("MakeMKV Auto Rip Copyright (C) 2018 Zac Ingoglia")
  );
  console.info(colors.line2("This program comes with ABSOLUTELY NO WARRANTY"));
  console.info(
    colors.line1(
      "This is free software, and you are welcome to redistribute it under certain conditions."
    )
  );
  console.info(
    colors.line2(
      'The full license file can be found in the root folder of this software as "LICENSE.md"'
    )
  );
  console.info(
    colors.line1(
      "Please fully read the README.md file found in the root folder before using this software."
    )
  );
  console.info("");
  console.info("");
  console.info(colors.line1("---Welcome to MakeMKV Auto Rip v0.6.0---"));
  console.info(colors.line1("---Developed by Zac Ingoglia (Poisonite)---"));
  console.info("");
  console.info("");
  console.info(
    colors.warning(
      "WARNING--Ensure that you have configured the Default.json file before ripping--WARNING"
    )
  );
  console.info("");
}

//Run program or exit
function ripOrDip() {
  console.info(
    colors.white.underline("Would you like to Auto Rip all inserted discs now?")
  );
  console.info(
    colors.white.underline(
      "This includes both internal and USB DVD and Blu-ray drives."
    )
  );
  console.info("");
  console.info(`Press ${colors.info("1")} to rip.`);
  console.info(`Press ${colors.error("2")} to exit.`);

  prompt(`${colors.info("Rip")} or ${colors.error("Dip")}? `)
    .then((TA) => {
      user.TA = TA;

      switch (TA) {
        case "1":
          console.info("");
          console.info(
            `${colors.time(moment().format("LTS"))} ${colors.dash(
              "-"
            )} ${colors.info("Beginning AutoRip... Please Wait.")}`
          );
          ripDVDs(movieRips);
          break;
        case "2":
          console.info("");
          console.info(
            `${colors.time(moment().format("LTS"))} ${colors.dash(
              "-"
            )} ${colors.error("Exiting...")}`
          );
          process.exit();
        default:
          process.exit();
      }
    })
    .catch((error) => {
      console.error(
        `${colors.time(moment().format("LTS"))} ${colors.dash(
          "-"
        )} ${colors.error("Critical Error, Must Abort!")}`
      );
      console.error(error);
      process.exit();
    });

  function prompt(question) {
    return new Promise((resolve, reject) => {
      const { stdin, stdout } = process;

      stdin.resume();
      stdout.write(question);

      stdin.on("data", (data) => resolve(data.toString().trim()));
      stdin.on("error", (err) => reject(err));
    });
  }
}

function validateFileDate(data) {
  console.log(`validateFileDate`, data);
  //This is the section for checking the MakeMKV version when the title command is run

  // check data to make sure that you opened a valid file.

  //is the length of data greater than 0

  //split first line
  //did we get more than one line
  //does the first line have the expected number of elements in the array
  //get version number of app/file
  //does match our expected version
  //if we don't get an true result on any of the above then raise exception to let the user know that the file or version isn't valid.
  return; // "You have a bad file";
}

function validateDriveFileDate(data) {
  // Check to make sure that there's text in the data payload that was sent
  if (data.length < 1) {
    console.error(
      `${colors.time(moment().format("LTS"))} ${colors.dash(
        "-"
      )} ${colors.error("Log data may be empty, exiting operation.")}`
    );
    return false; // "You have a bad file"
  }
  // Separate our header line from the reset of the initial log
  const msgArr = data.split(`MSG:`);

  // *This is the section for checking the MakeMKV version when the drive number command is run*

  // Check to make sure that our log output begins with a 1005 message
  //    This msg code outputs the MakeMKV software version
  if (msgArr[1].split(`,`)[0] === `1005`) {
    console.info(
      `${colors.time(moment().format("LTS"))} ${colors.dash("-")} ${colors.info(
        `MakeMKV version is:`
      )} ${colors.title(
        `${
          // Navigate through the data to the portion of the 1005 message containing the MakeMKV version number
          msgArr[1].split(`,`)[3].split(`"`)[1].split(` `)[1].split(`v`)[1]
        }`
      )}`
    );
  } else {
    console.error(
      `${colors.time(moment().format("LTS"))} ${colors.dash(
        "-"
      )} ${colors.error("Log header is incorrect, exiting operation.")}`
    );
    return false; // "You have a bad file"
  }

  // check data to make sure that you opened a valid file.
  let drivesExist = true;
  msgArr.forEach((msg) => {
    const msgCode = msg.split(`,`)[0];
    if (msgCode === "5042" && drivesExist) {
      drivesExist = !drivesExist;
    }
  });
  if (!drivesExist) {
    console.error(
      `${colors.time(moment().format("LTS"))} ${colors.dash(
        "-"
      )} ${colors.error(
        "No usable optical drives were found by MakeMKV, exiting operation."
      )}`
    );
    return false; // "You have a bad file"
  }

  return true; // File version/format is good
}

function getDriveInfo(data) {
  var validationMessage = validateDriveFileDate(data);
  if (!validationMessage) {
    return validationMessage;
  }

  var lines = data.split("\n");
  var validLines = lines
    .filter((line) => {
      //Get array of line attributes
      var lineArray = line.split(",");

      //make sure that the first element starts with "DRV:"
      if (lineArray[0].startsWith("DRV:")) {
        //Ensure that the number in the second element is = 2...meaning we have media
        return lineArray[1] == 2;
      }
    })
    .map((line) => {
      var driveInfo = {
        driveNumber: line.split(",")[0].substring(4),
        title: makeTitleValidFolderPath(line.split(",")[5]),
      };
      return driveInfo;
    });

  return validLines;
}

function getFileNumber(data) {
  var myTitleSectionValue = null,
    maxValue = 0;

  var validationMessage = validateFileDate(data);
  if (validationMessage) {
    return validationMessage;
  }

  var lines = data.split("\n");
  var validLines = lines.filter((line) => {
    var lineArray = line.split(",");

    if (lineArray[0].startsWith("TINFO:")) {
      //Ensure that the number in the second element is = 9. This is the "message code" that indicates title length
      return lineArray[1] == 9;
    }
  });

  validLines.forEach((line) => {
    //gets element of good lines that contains the title length and removes the quotes from it (leaving just the time in HH:MM:SS format)
    var videoTimeString = line.split(",")[3].replace(/['"]+/g, "");

    var videoTimeArray = videoTimeString.split(":");

    var videoTimeSeconds = getTimeInSeconds(videoTimeArray);

    //process the largest file. Then return title number for longest title.
    if (videoTimeSeconds > maxValue) {
      maxValue = videoTimeSeconds;
      myTitleSectionValue = line
        .split(",")[0] //split by comma and get the element with the title.
        .replace("TINFO:", ""); //Strip beginning info off element 0 to get only the title number.
    }
  });

  return myTitleSectionValue;
}

function getCopyCompleteMSG(data, commandDataItem) {
  var lines = data.split("\n");
  var validLines = lines.filter((line) => line.startsWith("MSG:5036"));
  var titleName = commandDataItem.title;
  if (validLines.length > 0) {
    console.info(
      `${colors.time(moment().format("LTS"))} ${colors.dash("-")} ${colors.info(
        "Done Ripping"
      )} ${colors.title(titleName)}`
    );
    goodVideoArray.push(titleName);
  } else {
    console.info(
      `${colors.time(moment().format("LTS"))} ${colors.dash("-")} ${colors.info(
        "Unable to rip"
      )} ${colors.title(titleName)} ${colors.info(
        "Try ripping with MakeMKV GUI."
      )}`
    );
    badVideoArray.push(titleName);
  }
}

function makeTitleValidFolderPath(title) {
  //escape out any chars that are not valid for file name.
  return title
    .replace("\\", "")
    .replace("/", "")
    .replace(":", "")
    .replace("*", "")
    .replace("?", "")
    .replace("<", "")
    .replace(">", "")
    .replace("|", "")
    .replace(/['"]+/g, "");
}

function getTimeInSeconds(timeArray) {
  return +timeArray[0] * 60 * 60 + +timeArray[1] * 60 + +timeArray[2];
}

function createUniqueFolder(outputPath, folderName) {
  var fs = require("fs");
  //console.log(outputPath, folderName)
  var dir = `${outputPath}\\${folderName}`;
  var folderCounter = 1;
  if (fs.existsSync(dir)) {
    while (fs.existsSync(`${dir}-${folderCounter}`)) {
      folderCounter++;
    }
    dir += `-${folderCounter}`;
  }
  fs.mkdirSync(dir);
  return dir;
}

function createUniqueFile(logDir, fileName) {
  var fs = require("fs");
  var dir = `${logDir}\\Log-${fileName}`;
  var fileCounter = 1;
  if (fs.existsSync(`${dir}.txt`)) {
    while (fs.existsSync(`${dir}-${fileCounter}.txt`)) {
      fileCounter++;
    }
    dir += `-${fileCounter}`;
  }
  //fs.writeFileSync(dir + '.txt', "") //saving for future update, this may be the solution but may also bork everything
  return `${dir}.txt`;
}

function getCommandData() {
  return new Promise((resolve, reject) => {
    console.info(
      `${colors.time(moment().format("LTS"))} ${colors.dash("-")} ${colors.info(
        "Getting info for all discs..."
      )}`
    );
    //console.log('mkv command', makeMKV + ' -r info disc:index')
    exec(makeMKV + " -r info disc:index", (err, stdout, stderr) => {
      if (stderr) {
        reject(stderr);
      }

      //get the data for drives with discs.
      console.info(
        `${colors.time(moment().format("LTS"))} ${colors.dash(
          "-"
        )} ${colors.info("Getting drive info...")}`
      );
      //console.log('Got Command Data Items', stdout);
      var driveInfo = getDriveInfo(stdout);
      if (!driveInfo) {
        return driveInfo;
      }

      //get an array of promises to get the file numbers for the longest file from each valid disc.
      var drivePromises = driveInfo.map((driveInfo) => {
        return new Promise((resolve, reject) => {
          console.info(
            `${colors.time(moment().format("LTS"))} ${colors.dash(
              "-"
            )} ${colors.info(
              "Getting file number for drive title"
            )} ${colors.title(driveInfo.driveNumber)}${colors.info(
              "-"
            )}${colors.title(driveInfo.title)}${colors.info(".")}`
          );
          exec(
            makeMKV + " -r info disc:" + driveInfo.driveNumber,
            (err, stdout, stderr) => {
              if (stderr) {
                reject(stderr);
              }

              var fileNumber = getFileNumber(stdout);
              console.info(
                `${colors.time(moment().format("LTS"))} ${colors.dash(
                  "-"
                )} ${colors.info("Got file info for")} ${colors.title(
                  driveInfo.driveNumber
                )}${colors.info("-")}${colors.title(
                  driveInfo.title
                )}${colors.info(".")}`
              );
              resolve({
                driveNumber: driveInfo.driveNumber,
                title: driveInfo.title,
                fileNumber: fileNumber,
              });
            }
          );
        });
      });

      Promise.all(drivePromises)
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

function processArray(array, fn, outputPath) {
  var results = [];
  return array.reduce((p, item) => {
    return p.then(() => {
      return fn(item, outputPath).then((data) => {
        results.push(data);
        return results;
      });
    });
  }, Promise.resolve());
}

function ripDVD(commandDataItem, outputPath) {
  return new Promise((resolve, reject) => {
    var dir = createUniqueFolder(outputPath, commandDataItem.title);

    console.info(
      `${colors.time(moment().format("LTS"))} ${colors.dash("-")} ${colors.info(
        "Ripping Title"
      )} ${colors.title(commandDataItem.title)} ${colors.info(`to ${dir}...`)}`
    );

    exec(
      makeMKV +
        " -r mkv disc:" +
        commandDataItem.driveNumber +
        " " +
        commandDataItem.fileNumber +
        " " +
        '"' +
        dir +
        '"',
      (err, stdout, stderr) => {
        if (stderr) {
          console.error(
            `${colors.time(moment().format("LTS"))} ${colors.dash(
              "-"
            )} ${colors.error(
              `Critical Error Ripping ${colors.title(commandDataItem.title)}`,
              stderr
            )}`
          );
          reject(stderr);
        } else {
          //console.log(colors.blue('OUTPUT', stdout)); //Outputs full log data to console after ripping (or attempting to rip) each DVD
          var fileName = createUniqueFile(logDir, commandDataItem.title);

          if (fileLog == "true") {
            fs.writeFile(fileName, stdout, "utf8", function (err) {
              if (err)
                console.error(
                  `${colors.time(moment().format("LTS"))} ${colors.dash(
                    "-"
                  )} ${colors.error(
                    "Directory for logs does not exist. Please Create it."
                  )}`
                );
              console.info(
                `${colors.time(moment().format("LTS"))} ${colors.dash(
                  "-"
                )} ${colors.info("Full Log file for")} ${colors.title(
                  commandDataItem.title
                )} ${colors.info("has been written to file")}`
              );
              // console.info(colors.time(moment().format('LTS')) + colors.dash(' - ') + colors.info('Done Ripping ' + colors.title(commandDataItem.title)));
              console.info(getCopyCompleteMSG(stdout, commandDataItem));
              resolve(commandDataItem.title);
              console.info("");
            });
          } else {
            // console.info(colors.time(moment().format('LTS')) + colors.dash(' - ') + colors.info('Done Ripping ' + colors.title(commandDataItem.title)));
            console.info(getCopyCompleteMSG(stdout, commandDataItem));
            resolve(commandDataItem.title);
            console.info("");
          }
        }
      }
    );
  });
}

function ripDVDs(outputPath) {
  getCommandData()
    .then((commandDataItems) => {
      //Rip the DVDs synchronously.
      processArray(commandDataItems, ripDVD, outputPath).then(
        (result) => {
          console.info(
            `${colors.time(moment().format("LTS"))} ${colors.dash(
              "-"
            )} ${colors.info(
              "The following DVD titles have been successfully ripped."
            )}`,
            colors.title(goodVideoArray)
          );
          console.info(
            `${colors.time(moment().format("LTS"))} ${colors.dash(
              "-"
            )} ${colors.info("The following DVD titles failed to rip.")}`,
            colors.title(badVideoArray)
          );
          ejectDVDs();
          //process.exit();
          // all done here
          // array of data here in result
        },
        (reason) => {
          console.error(
            `${colors.time(moment().format("LTS"))} ${colors.dash(
              "-"
            )} ${colors.error(
              "Uncorrectable Error Ripping One or More DVDs."
            )}`,
            colors.blue(reason)
          );
          // rejection happened
        }
      );
    })
    .catch((err) => {
      console.error(
        `${colors.time(moment().format("LTS"))} ${colors.dash(
          "-"
        )} ${colors.error(err)}`
      );
    });
}

function ejectDVDs() {
  if (eject == "true") {
    winEject.eject("", function () {
      console.info(
        `${colors.time(moment().format("LTS"))} ${colors.dash(
          "-"
        )} ${colors.info("All DVDs have been ejected.")}`
      );
      process.exit();
    });
  } else {
    process.exit();
  }
}
