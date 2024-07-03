import { database } from "@/database";
import { migrate } from "drizzle-orm/libsql/migrator";

const main = async () => {
  try {
    await migrate(database, {
      migrationsFolder: "src/drizzle/migrations",
    });

    console.log("Migration successful");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

main();
