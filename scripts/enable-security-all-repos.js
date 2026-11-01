#!/usr/bin/env node
const { execSync } = require('child_process');

function execJson(cmd, input) {
  try {
    const opts = { stdio: ['pipe', 'pipe', 'pipe'] };
    if (input) opts.input = input;
    const stdout = execSync(cmd, opts).toString();
    return { ok: true, data: stdout ? JSON.parse(stdout) : null };
  } catch (err) {
    return { ok: false, error: (err.stderr ? err.stderr.toString() : err.message).trim() };
  }
}

function execSilent(cmd) {
  try {
    execSync(cmd, { stdio: ['ignore', 'ignore', 'pipe'] });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err.stderr ? err.stderr.toString() : err.message).trim() };
  }
}

async function run() {
  console.log('Fetching repositories for aktonay...');
  const reposRes = execJson('gh repo list aktonay --limit 200 --json name,isPrivate,isFork,defaultBranchRef');
  if (!reposRes.ok) {
    console.error('Failed to list repos:', reposRes.error);
    process.exit(1);
  }

  const repos = reposRes.data;
  console.log(`Found ${repos.length} repositories.\n`);

  const results = [];

  for (let i = 0; i < repos.length; i++) {
    const r = repos[i];
    const name = r.name;
    const isPrivate = r.isPrivate;
    const defaultBranch = r.defaultBranchRef ? r.defaultBranchRef.name : 'main';

    process.stdout.write(`[${i + 1}/${repos.length}] ${name} (${isPrivate ? 'private' : 'public'})... `);

    const report = {
      name,
      isPrivate,
      vulnAlerts: false,
      secUpdates: false,
      secretScanning: false,
      pushProtection: false,
      ruleset: false
    };

    // 1. Enable Dependabot vulnerability & malware alerts
    const vulnRes = execSilent(`gh api -X PUT /repos/aktonay/${name}/vulnerability-alerts`);
    if (vulnRes.ok) report.vulnAlerts = true;

    // 2. Enable Dependabot automated security fixes
    const secRes = execSilent(`gh api -X PUT /repos/aktonay/${name}/automated-security-fixes`);
    if (secRes.ok) report.secUpdates = true;

    // 3. Secret scanning & push protection (for public repos)
    if (!isPrivate) {
      const secPayload = JSON.stringify({
        security_and_analysis: {
          secret_scanning: { status: 'enabled' },
          secret_scanning_push_protection: { status: 'enabled' }
        }
      });
      const patchRes = execJson(`gh api -X PATCH /repos/aktonay/${name} --input -`, secPayload);
      if (patchRes.ok && patchRes.data && patchRes.data.security_and_analysis) {
        const sa = patchRes.data.security_and_analysis;
        report.secretScanning = sa.secret_scanning && sa.secret_scanning.status === 'enabled';
        report.pushProtection = sa.secret_scanning_push_protection && sa.secret_scanning_push_protection.status === 'enabled';
      }

      // 4. Force Push & Deletion Protection Ruleset
      const listRules = execJson(`gh api /repos/aktonay/${name}/rulesets`);
      let hasRuleset = false;
      if (listRules.ok && Array.isArray(listRules.data)) {
        hasRuleset = listRules.data.some(rs => rs.name === 'Block Force Push & Deletion');
      }

      if (hasRuleset) {
        report.ruleset = true;
      } else {
        const rulesetPayload = JSON.stringify({
          name: 'Block Force Push & Deletion',
          target: 'branch',
          enforcement: 'active',
          conditions: {
            ref_name: {
              include: ['~DEFAULT_BRANCH'],
              exclude: []
            }
          },
          rules: [
            { type: 'non_fast_forward' },
            { type: 'deletion' }
          ]
        });
        const createRuleset = execJson(`gh api -X POST /repos/aktonay/${name}/rulesets --input -`, rulesetPayload);
        if (createRuleset.ok) report.ruleset = true;
      }
    }

    results.push(report);
    console.log(`✓ (VulnAlerts: ${report.vulnAlerts ? 'ON' : 'OFF'}, SecUpdates: ${report.secUpdates ? 'ON' : 'OFF'}${!isPrivate ? `, PushProt: ${report.pushProtection ? 'ON' : 'OFF'}, AntiForcePush: ${report.ruleset ? 'ON' : 'OFF'}` : ''})`);
  }

  console.log('\n========================================');
  console.log('         SECURITY ROLLOUT SUMMARY        ');
  console.log('========================================');
  console.log(`Total Repositories Processed: ${results.length}`);
  console.log(`Dependabot Vulnerability & Malware Alerts Enabled: ${results.filter(r => r.vulnAlerts).length}`);
  console.log(`Dependabot Security Updates Enabled: ${results.filter(r => r.secUpdates).length}`);
  console.log(`Secret Scanning Enabled (Public): ${results.filter(r => r.secretScanning).length}`);
  console.log(`Push Protection Enabled (Public): ${results.filter(r => r.pushProtection).length}`);
  console.log(`Anti-Force Push Rulesets Active (Public): ${results.filter(r => r.ruleset).length}`);
  console.log('========================================\n');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
