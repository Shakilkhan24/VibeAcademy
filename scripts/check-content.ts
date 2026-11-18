/**
 * Validates every content file and the links between them. Run: pnpm content:check
 * CI runs this on every pull request.
 */
import { checkContentIntegrity, loadCards, loadEpisodes, loadMethodology } from "../src/content/index";

async function main() {
  const cards = await loadCards();
  const episodes = await loadEpisodes();
  const methodology = await loadMethodology();
  const problems = await checkContentIntegrity();

  console.info(`Cards: ${cards.length} (${cards.filter((c) => c.status === "reviewed").length} reviewed, ${cards.filter((c) => c.status === "draft").length} draft)`);
  console.info(`Lab: methodology v${methodology.version}, ${methodology.metrics.length} metrics, ${episodes.length} episode(s)`);

  if (problems.length > 0) {
    console.error(`\n${problems.length} content problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.info("Content OK.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
