const { exec } = require('child_process');

function invoke_ledger(exePath: string, filePath: string, args: string[]): Promise<string> {
    let output = new Promise<string>((resolve, reject) => {
        const executeString = exePath + " " + (filePath ? "-f " + filePath + " " : "") + args.join(" ");
        console.debug("Invoking ledger: ", executeString);
        exec(executeString, (error: any, stdout: string, stderr: string) => {
            if (error) {
                reject(error.message);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            console.log("Received stdout: " + stdout);
            resolve(stdout);
        });
    });
    return output;
}

export { invoke_ledger };