import { Console, Effect, Layer, Runtime } from "effect";
import { HonoServer } from "./HonoServer";
import { Database, NoteRepository, NoteRepositoryLive } from "./NoteRepository";

const NoteRouteLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const app = yield* HonoServer;
    const runPromise = Runtime.runPromise(
      yield* Effect.runtime<NoteRepository>()
    );

    app.post("/notes", async (c) =>
      Effect.gen(function* () {
        const noteRepository = yield* NoteRepository;

        const { content } = yield* Effect.tryPromise(() =>
          c.req.json<{ content: string }>()
        );

        yield* noteRepository.createNote(content);

        const result = yield* noteRepository.getAllNotes();

        c.status(201);
        return c.json(result);
      }).pipe(
        Effect.catchAll((e) =>
          Effect.gen(function* () {
            yield* Console.error(e);
            c.status(500);
            return c.text("Error creating note");
          })
        ),
        runPromise
      )
    );

    app.get("/notes", async (c) =>
      Effect.gen(function* () {
        const noteRepository = yield* NoteRepository;

        const result = yield* noteRepository.getAllNotes();

        c.status(200);
        return c.json(result);
      }).pipe(
        Effect.catchAll((e) =>
          Effect.gen(function* () {
            yield* Console.error(e);
            c.status(500);
            return c.text("Error getting notes");
          })
        ),
        runPromise
      )
    );

    app.delete("/notes", async (c) =>
      Effect.gen(function* () {
        const noteRepository = yield* NoteRepository;

        yield* noteRepository.deleteAllNotes();

        c.status(200);
        return c.text("Notes deleted successfully");
      }).pipe(
        Effect.catchAll((e) =>
          Effect.gen(function* () {
            yield* Console.error(e);
            c.status(500);
            return c.text("Error deleting notes");
          })
        ),
        runPromise
      )
    );

    app.get("/notes/:id", async (c) =>
      Effect.gen(function* () {
        const noteRepository = yield* NoteRepository;

        const id = c.req.param("id");

        const result = yield* noteRepository.getNote(id);

        c.status(200);
        return c.json(result);
      }).pipe(
        Effect.catchAll((e) =>
          Effect.gen(function* () {
            yield* Console.error(e);
            c.status(500);
            return c.text("Error getting note");
          })
        ),
        runPromise
      )
    );

    app.delete("/notes/:id", async (c) =>
      Effect.gen(function* () {
        const noteRepository = yield* NoteRepository;

        yield* noteRepository.deleteNote(c.req.param("id"));

        c.status(200);
        return c.text("Notes deleted successfully");
      }).pipe(
        Effect.catchAll((e) =>
          Effect.gen(function* () {
            yield* Console.error(e);
            c.status(500);
            return c.text("Error deleting notes");
          })
        ),
        runPromise
      )
    );
  })
);

export default await HonoServer.pipe(
  Effect.provide(NoteRouteLive),
  Effect.provide(HonoServer.Live),
  Effect.provide(NoteRepositoryLive),
  Effect.provide(Database.Live),
  Effect.runPromise
);
