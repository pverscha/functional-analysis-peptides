const readline = require('readline');
const fs = require('fs');

const start = new Date().getTime();

const args = process.argv;

if (args.length !== 4) {
    console.log("Please provide 2 parameters: input and output.");
    process.exit(1);
}

const inputFile = args[2];
const outputFile = args[3];

const readInterface = readline.createInterface({
    input: fs.createReadStream(inputFile)
});

const writer = fs.createWriteStream(outputFile);

let row = null;
let curPept = null;
let numProt = 0;
let numAnnotatedGO = 0;
let numAnnotatedEC = 0;
let numAnnotatedInterPro = 0;
let done = 0;

let m = {};

readInterface.on('line', function(line) {
    row = line.split("\t");

    if (row[0] !== curPept) {
        if (curPept !== null) {
            if (m.size !== 0) {
                const out = {
                    num: {
                        all: numProt,
                        EC: numAnnotatedEC,
                        GO: numAnnotatedGO,
                        IPR: numAnnotatedInterPro
                    },
                    data: m
                }
                writer.write(curPept + "\t" + JSON.stringify(out) + "\n");
            }
        }

        m = {};
        numProt = 0;
        numAnnotatedGO = 0;
        numAnnotatedEC = 0;
        numAnnotatedInterPro = 0;
        curPept = row[0];
    }

    numProt++;

    if (row.length > 1) {
        const terms = row[1].split(";");

        let hasEC = false;
        let hasGO = false;
        let hasInterPro = false;

        for (const term of terms) {
            hasGO |= term.startsWith("GO");
            hasEC |= term.startsWith("EC");
            hasInterPro |= term.startsWith("IPR");

            m[term] = (m[term] || 0) + 1
        }

        numAnnotatedGO += hasGO ? 1 : 0;
        numAnnotatedEC += hasEC ? 1 : 0;
        numAnnotatedInterPro += hasInterPro ? 1 : 0;
    }
    done++;

    if (done % 1000000 === 0) {
        console.log("FA " + done + " rows");
    }
});


readInterface.on('close', function() {
    if (m.size !== 0) {
        const out = {
            num: {
                all: numProt,
                EC: numAnnotatedEC,
                GO: numAnnotatedGO,
                IPR: numAnnotatedInterPro
            },
            data: m
        }
        writer.write(curPept + "\t" + JSON.stringify(out) + "\n");
    }

    writer.end();
    const end = new Date().getTime();
    console.log("Took " + (end - start) / 1000 + "s");
})
