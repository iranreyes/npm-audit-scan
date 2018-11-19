'use strict';
var exec = require('child_process').exec;
var fs = require('fs');

var NPM_AUDIT_RC_FILE = './.npmauditrc';
var VULNERABILITY_LEVEL = ['info', 'low', 'moderate', 'high', 'critical'];

function parseOptions() {
  var defaultOptions = {
    minVulnerability: 'low',
    vulnerabilitiesToSkip: []
  };

  if (fs.existsSync(NPM_AUDIT_RC_FILE)) {
    var optionFile = fs.readFileSync(NPM_AUDIT_RC_FILE, 'utf8');

    try {
      var optionJSONFile = JSON.parse(optionFile);
      return Object.assign({}, defaultOptions, optionJSONFile);
    } catch (err) {
      return defaultOptions;
    }
  }

  return defaultOptions;
}

exec('npm audit --json=true', function(error, stdout, stderr) {
  if (stdout) {
    var options = parseOptions();

    try {
      var auditOutput = JSON.parse(stdout);

      var minVulnerabilityIndex = VULNERABILITY_LEVEL.indexOf(options.minVulnerability);
      var foundVulnerabilities = {};

      VULNERABILITY_LEVEL.forEach(function(value, index) {
        if (index >= minVulnerabilityIndex && auditOutput.metadata.vulnerabilities[value] > 0) {
          foundVulnerabilities[value] = auditOutput.metadata.vulnerabilities[value];
          // TODO: Filter vulnerabilities in the skip array
        }
      });

      if (Object.keys(foundVulnerabilities).length > 0) {
        console.log('Found vulnerabilities, run `npm audit` for more details');
        console.log(foundVulnerabilities);
        process.exit(1);
        return;
      }

      console.log('0 vulnerabilities found');
      return;
    } catch (err) {
      console.error('Invalid output');
      return;
    }
  }

  if (error !== null) {
    console.log('exec Error: ' + error);
  }
});
