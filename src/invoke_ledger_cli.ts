const { exec } = require('child_process');

/**
 * Invokes the ledger executable with the given arguments
 * @param exePath Path to the ledger executable
 * @param filePath Path to the transactions file to be used
 * @param args Arguments to be passed to the ledger executable
 * @returns Promise<string> Promise that resolves to the output of the ledger executable
 */
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