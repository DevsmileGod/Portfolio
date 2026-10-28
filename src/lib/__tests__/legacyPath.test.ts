import { describe, expect, it } from "vitest";
import { toHashRoute } from "../legacyPath";

describe("toHashRoute", () => {
  it("maps a legacy project path", () => {
    expect(toHashRoute("/Portfolio/project/my-repo", "", "/Portfolio/")).toBe("/Portfolio/#/project/my-repo");
  });
  it("keeps casing and query", () => {
    expect(toHashRoute("/Portfolio/project/my-repo", "?x=1", "/Portfolio/")).toBe("/Portfolio/#/project/my-repo?x=1");
  });
  it("leaves the base alone", () => {
    expect(toHashRoute("/Portfolio/", "", "/Portfolio/")).toBeNull();
    expect(toHashRoute("/Portfolio/index.html", "", "/Portfolio/")).toBeNull();
  });
  it("works with the dev base", () => {
    expect(toHashRoute("/", "", "/")).toBeNull();
    expect(toHashRoute("/project/x", "", "/")).toBe("/#/project/x");
  });
});
