import { join, dirname, resolve } from "node:path";
import { existsSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { format } from "date-fns";
import { rimrafSync } from "rimraf";

function findRootDir(dir: string) {
  if (existsSync(join(dir, "package.json"))) {
    return dir;
  }
  const parentDir = dirname(dir);
  if (dir === parentDir) {
    return dir;
  }

  return findRootDir(parentDir);
}

const CWD = process.cwd();
const ROOT = findRootDir(CWD);

function deleteChangeLog() {
  const changeLogISExist = existsSync(resolve(CWD, "CHANGELOG.md"));
  if (changeLogISExist) {
    rimrafSync(resolve(CWD, "CHANGELOG.md"));
  }
}

function getGitCommitHistory() {
  const historys = execSync(`git log`, { cwd: ROOT }) ?? "";
  const contents = historys.toString().split(/commit/g) ?? [];

  contents.forEach((line) => {
    const record = line.split("\n");
    if (record.length > 1) {
      let commitInfo;
      // eslint-disable-next-line prefer-const
      let [commitId, merge, author, date] = record;
      if (!merge.includes("Merge")) {
        date = author;
        author = merge;
        commitInfo = record.slice(3);
      } else {
        commitInfo = record.slice(4);
      }
      commitInfo = commitInfo.filter((m) => m).map((e) => e.trim());

      date = date.replace("Date:", "");
      if (date) {
        date = format(new Date(date), "yyyy-MM-dd HH:MM");
      }

      const content = `
### ${date}
- ${commitInfo}
- CommitId: ${commitId}
- ${author}
      `;
      appendFileSync(resolve(CWD, "CHANGELOG.md"), content);
    }
  });
}

deleteChangeLog();
getGitCommitHistory();
