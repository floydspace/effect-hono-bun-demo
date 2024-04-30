import { Context, Effect, Layer } from "effect";
import { Hono } from "hono";
import { NoteRepository } from "./NoteRepository";

export class HonoServer extends Context.Tag("HonoServer")<HonoServer, Hono>() {
  static readonly Live = Layer.effect(
    HonoServer,
    NoteRepository.pipe(
      Effect.andThen((repo) => repo.createTable()),
      Effect.andThen(() => new Hono())
    )
  );
}
