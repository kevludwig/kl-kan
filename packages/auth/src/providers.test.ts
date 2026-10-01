import { describe, expect, it } from "vitest";

import { mapMicrosoftProfileToUser } from "./providers";

const PERSONAL_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";
const WORK_TENANT = "72f988bf-86f1-41af-91ab-2d7cd011db47";

describe("mapMicrosoftProfileToUser", () => {
  it("trusts work accounts whose tenant owns the email domain", () => {
    expect(
      mapMicrosoftProfileToUser(
        { tid: WORK_TENANT, email: "a@example.com", xms_edov: true },
        "common",
      ),
    ).toEqual({ emailVerified: true });
  });

  it("accepts string and numeric xms_edov values", () => {
    for (const xms_edov of ["true", 1, "1"]) {
      expect(
        mapMicrosoftProfileToUser({ tid: WORK_TENANT, xms_edov }, "common"),
      ).toEqual({ emailVerified: true });
    }
  });

  it("trusts personal Microsoft accounts", () => {
    expect(
      mapMicrosoftProfileToUser(
        { tid: PERSONAL_TENANT, email: "a@outlook.com" },
        "common",
      ),
    ).toEqual({ emailVerified: true });
  });

  it("drops unverified emails in multi-tenant mode", () => {
    expect(
      mapMicrosoftProfileToUser(
        { tid: WORK_TENANT, email: "victim@example.com", xms_edov: false },
        "common",
      ),
    ).toEqual({ emailVerified: false, email: "" });

    expect(
      mapMicrosoftProfileToUser(
        { tid: WORK_TENANT, email: "victim@example.com" },
        "Organizations",
      ),
    ).toEqual({ emailVerified: false, email: "" });
  });

  it("keeps unverified emails for single-tenant setups", () => {
    expect(
      mapMicrosoftProfileToUser(
        { tid: WORK_TENANT, email: "a@example.com" },
        WORK_TENANT,
      ),
    ).toEqual({ emailVerified: false });
  });
});
