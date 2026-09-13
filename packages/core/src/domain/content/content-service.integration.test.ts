import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "../../shared/types";
import { contentService, permissionService, userService } from "../../server";

/**
 * Integration test against the REAL local Postgres database (matches this
 * project's established preference for real-DB testing over mocks — every
 * other verification in this codebase's history has been curl against the
 * real running stack). Requires `DATABASE_URL` pointing at a reachable
 * Postgres with migrations applied (`pnpm db:migrate`) and the seed admin
 * user present (`pnpm db:seed`) — both already required for any dev work on
 * this repo, so no extra setup beyond the normal onboarding steps.
 *
 * This intentionally reuses the real seeded admin user (via
 * permissionService.loadActor) rather than fabricating an Actor object,
 * because content.authorId is a NOT NULL FK to users.id — an actor id with
 * no matching row would fail on insert. Only the `content` rows created
 * here are test fixtures, and they're deleted in afterAll.
 */
describe("ContentService (integration, real Postgres)", () => {
  let actor: Actor;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const admin = await userService.findByEmail("admin@example.com");
    if (!admin) {
      throw new Error("Seed admin user not found — run `pnpm db:seed` before running tests");
    }
    const resolved = await permissionService.loadActor(admin.id);
    if (!resolved) {
      throw new Error("Failed to resolve admin actor");
    }
    actor = resolved;
  });

  afterAll(async () => {
    await Promise.all(createdIds.map((id) => contentService.delete(actor, id).catch(() => undefined)));
  });

  it("creates a draft post", async () => {
    const post = await contentService.create(actor, {
      type: "post",
      slug: `vitest-fixture-create-${Date.now()}`,
      title: "Vitest Fixture",
      content: { version: 1, type: "doc", content: [] }
    });
    createdIds.push(post.id);

    expect(post.status).toBe("draft");
    expect(post.authorId).toBe(actor.id);
  });

  it("snapshots a revision of the pre-update state on every update()", async () => {
    const post = await contentService.create(actor, {
      type: "post",
      slug: `vitest-fixture-revision-${Date.now()}`,
      title: "Revision Fixture v1",
      content: { version: 1, type: "doc", content: [] }
    });
    createdIds.push(post.id);

    await contentService.update(actor, post.id, { title: "Revision Fixture v2" });

    const revisions = await contentService.listRevisions(post.id);
    expect(revisions).toHaveLength(1);
    expect(revisions[0]?.title).toBe("Revision Fixture v1");

    const current = await contentService.getById(post.id);
    expect(current?.title).toBe("Revision Fixture v2");
  });

  it("publish() sets status to published and stamps publishedAt", async () => {
    const post = await contentService.create(actor, {
      type: "post",
      slug: `vitest-fixture-publish-${Date.now()}`,
      title: "Publish Fixture",
      content: { version: 1, type: "doc", content: [] }
    });
    createdIds.push(post.id);

    const published = await contentService.publish(actor, post.id);
    expect(published.status).toBe("published");
    expect(published.publishedAt).not.toBeNull();
  });

  it("enforces the publishing state machine — rejects an illegal transition", async () => {
    const post = await contentService.create(actor, {
      type: "post",
      slug: `vitest-fixture-workflow-${Date.now()}`,
      title: "Workflow Fixture",
      content: { version: 1, type: "doc", content: [] }
    });
    createdIds.push(post.id);

    const trashed = await contentService.trash(actor, post.id);
    expect(trashed.status).toBe("trashed");

    await expect(contentService.transitionStatus(actor, post.id, "published")).rejects.toThrow(
      /Cannot transition content from trashed to published/
    );

    const restored = await contentService.restoreFromTrash(actor, post.id);
    expect(restored.status).toBe("draft");
  });

  it("restoreRevision() snapshots the current state first, so the restore itself is undoable", async () => {
    const post = await contentService.create(actor, {
      type: "post",
      slug: `vitest-fixture-restore-${Date.now()}`,
      title: "Restore Fixture v1",
      content: { version: 1, type: "doc", content: [] }
    });
    createdIds.push(post.id);

    await contentService.update(actor, post.id, { title: "Restore Fixture v2" });
    const revisionsAfterV2 = await contentService.listRevisions(post.id);
    const v1RevisionId = revisionsAfterV2[0]?.id;
    expect(v1RevisionId).toBeDefined();

    const restored = await contentService.restoreRevision(actor, post.id, v1RevisionId!);
    expect(restored.title).toBe("Restore Fixture v1");

    const revisionsAfterRestore = await contentService.listRevisions(post.id);
    expect(revisionsAfterRestore).toHaveLength(2);
    expect(revisionsAfterRestore[0]?.title).toBe("Restore Fixture v2");
  });

  it("delete() removes the content row", async () => {
    const post = await contentService.create(actor, {
      type: "post",
      slug: `vitest-fixture-delete-${Date.now()}`,
      title: "Delete Fixture",
      content: { version: 1, type: "doc", content: [] }
    });

    await contentService.delete(actor, post.id);
    expect(await contentService.getById(post.id)).toBeUndefined();
  });
});
