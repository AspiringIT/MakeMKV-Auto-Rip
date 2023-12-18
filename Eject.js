const moment = require('moment');
const { exec } = require('child_process');
colors = require('colors/safe');

//Color theme settings for colored text
colors.setTheme({
    info: 'green',
    time: 'yellow',
    dash: 'gray'
});

function ejectAllDVDs() {
  const ejectCommand = process.platform === 'win32' ?
    'powershell -Command "(New-Object -comObject "Shell.Application").Namespace(17).ParseName(\"D:\").InvokeVerb(\"Eject\")"' :
    process.platform === 'darwin' ? 'drutil eject' :
    'eject';

  exec(ejectCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);

    // Print a message after discs have been ejected
    console.log('All DVDs have been ejected.');

    // Exit the program after ejecting the discs
    process.exit();
  });
}

// Call the function to eject all DVDs
ejectAllDVDs();
