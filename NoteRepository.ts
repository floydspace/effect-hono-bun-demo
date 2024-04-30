import { Database as Db } from "bun:sqlite";
import { Cause, Console, Context, Effect, Layer } from "effect";

export class Database extends Context.Tag("Database")<Database, Db>() {
  static readonly Live = Layer.sync(Database, () => new Db());
}

export interface Note {
  id: number;
  content: string;
}

export interface NoteRepository {
  readonly createTable: () => Effect.Effect<void, Cause.UnknownException>;
  readonly createNote: (
    content: string
  ) => Effect.Effect<Note[], Cause.UnknownException>;
  readonly getAllNotes: () => Effect.Effect<Note[], Cause.UnknownException>;
  readonly getNote: (
    id: string
  ) => Effect.Effect<Note[], Cause.UnknownException>;
  readonly deleteAllNotes: () => Effect.Effect<void, Cause.UnknownException>;
  readonly deleteNote: (
    id: string
  ) => Effect.Effect<void, Cause.UnknownException>;
}
export const NoteRepository =
  Context.GenericTag<NoteRepository>("NoteRepository");

export const NoteRepositoryLive = Layer.effect(
  NoteRepository,
  Effect.gen(function* () {
    const db = yield* Database;

    return NoteRepository.of({
      createTable: () =>
        Effect.sync(() =>
          db
            .query(
              "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, content TEXT UNIQUE)"
            )
            .all()
        ),
      createNote: (content) =>
        Effect.try(() =>
          db
            .query<Note, { $content: string }>(
              "INSERT INTO notes (content) VALUES ($content)"
            )
            .all({ $content: content })
        ).pipe(Effect.tapError((e) => Console.log(e))),
      getAllNotes: () =>
        Effect.try(() =>
          db.query<Note, never[]>("SELECT * FROM notes").all()
        ).pipe(Effect.tapError((e) => Console.log(e))),
      getNote: (id: string) =>
        Effect.try(() =>
          db
            .query<Note, { $id: string }>(
              "SELECT * FROM notes where notes.id = $id LIMIT 1"
            )
            .all({ $id: id })
        ).pipe(Effect.tapError((e) => Console.log(e))),
      deleteAllNotes: () =>
        Effect.try(() => db.query("DELETE FROM notes").all()).pipe(
          Effect.tapError((e) => Console.log(e))
        ),
      deleteNote: (id: string) =>
        Effect.try(() =>
          db.query("DELETE FROM notes where id = $id").all({ $id: id })
        ).pipe(Effect.tapError((e) => Console.log(e))),
    });
  })
);
