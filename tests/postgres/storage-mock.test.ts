import assert from "node:assert/strict";
import test from "node:test";

class MockStorage {
  readonly objects = new Set<string>();
  readonly referenced = new Set<string>();
  failRemove = false;

  async upload(path: string, persistThenFail = false): Promise<boolean> {
    this.objects.add(path);
    return !persistThenFail;
  }

  async remove(path: string): Promise<boolean> {
    if (this.failRemove || this.referenced.has(path)) return false;
    this.objects.delete(path);
    return true;
  }
}

test("a possibly persisted upload error can leave an orphan for reconciliation", async () => {
  const storage = new MockStorage();
  const uploaded = await storage.upload("synthetic/upload-error", true);

  assert.equal(uploaded, false);
  assert.equal(storage.objects.has("synthetic/upload-error"), true);
});

test("failed Storage cleanup leaves the unreferenced object for later reconciliation", async () => {
  const storage = new MockStorage();
  storage.objects.add("synthetic/orphan");
  storage.failRemove = true;

  assert.equal(await storage.remove("synthetic/orphan"), false);
  assert.equal(storage.objects.has("synthetic/orphan"), true);
});

test("cleanup does not delete an object still referenced by metadata", async () => {
  const storage = new MockStorage();
  storage.objects.add("synthetic/current");
  storage.referenced.add("synthetic/current");

  assert.equal(await storage.remove("synthetic/current"), false);
  assert.equal(storage.objects.has("synthetic/current"), true);
});
