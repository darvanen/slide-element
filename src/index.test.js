import { up, down, toggle } from "./index";
import { screen } from "@testing-library/dom";

const addMockAnimation = (element, id = "") => {
  const mockAnimation = {
    finish: jest.fn(),
    id,
  };

  element.getAnimations = () => [mockAnimation];

  return mockAnimation;
};

const withMockAnimation = (element, duration = 0) => {
  const finish = jest.fn();
  const reverse = jest.fn();
  let timeCalled = null;

  element.getAnimations = () => [];
  element.animate = jest.fn(() => {
    timeCalled = new Date().getTime();

    return {
      finished: new Promise((resolve) => {
        setTimeout(resolve, duration);
      }),
      finish,
    };
  });

  return { element, finish, reverse, getTimeCalled: () => timeCalled };
};

const mockHeightOnce = (values) => {
  const mock = jest.spyOn(HTMLDivElement.prototype, "clientHeight", "get");

  return values.reduce((m, val) => m.mockImplementationOnce(() => val), mock);
};

const mockOffsetHeight = (height = null) => {
  jest
    .spyOn(HTMLDivElement.prototype, "offsetHeight", "get")
    .mockImplementation(() => height);
};

const mockHeight = (value) => {
  return jest
    .spyOn(HTMLDivElement.prototype, "clientHeight", "get")
    .mockImplementation(() => value);
};

beforeEach(() => {
  document.body.innerHTML = `<div data-testid="content" style="display: none;">Content!</div>`;
  mockHeight(100);

  window.requestAnimationFrame = (cb) => cb();

  // Does NOT prefer reduced motion.
  window.matchMedia = () => {
    return {
      matches: false,
    };
  };
});

it("opens element", (done) => {
  document.body.innerHTML = `<div data-testid="content" style="display: none;">Content!</div>`;
  const { element } = withMockAnimation(screen.getByTestId("content"));

  mockHeightOnce([0, 100]);

  down(element).then((opened) => {
    expect(opened).toBe(true);
    expect(element.animate).toBeCalledTimes(1);
    expect(element.style.display).toEqual("block");

    expect(element.animate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          height: "0px",
          paddingBottom: "0px",
          paddingTop: "0px",
        }),
        expect.objectContaining({
          height: "100px",
          paddingBottom: "",
          paddingTop: "",
        }),
      ],
      { easing: "ease", duration: 250, fill: "backwards" }
    );

    done();
  });
});

it("closes element", (done) => {
  document.body.innerHTML = `<div data-testid="content" style="height: 100px">Content!</div>`;
  const { element } = withMockAnimation(screen.getByTestId("content"));

  up(element).then((opened) => {
    expect(opened).toBe(false);
    expect(element.animate).toBeCalledTimes(1);
    expect(element.style.display).toEqual("none");
    expect(element.animate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          height: "100px",
          paddingBottom: "",
          paddingTop: "",
        }),
        expect.objectContaining({
          height: "0px",
          paddingBottom: "0px",
          paddingTop: "0px",
        }),
      ],
      { easing: "ease", duration: 250, fill: "backwards" }
    );

    done();
  });
});

describe("toggle()", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div data-testid="content" style="display: none;">Content!</div>`;
  });

  describe("animation is allowed to complete fully", () => {
    it("toggles element open", (done) => {
      const { element } = withMockAnimation(screen.getByTestId("content"));

      toggle(element).then((opened) => {
        expect(opened).toBe(true);
        expect(element.animate).toBeCalledTimes(1);

        done();
      });
    });

    it("toggles element closed", (done) => {
      const { element } = withMockAnimation(screen.getByTestId("content"));

      // Give it an arbitrary height to mock it being "open."
      mockOffsetHeight(100);

      toggle(element).then((opened) => {
        expect(opened).toBe(false);
        expect(element.animate).toBeCalledTimes(1);

        done();
      });
    });
  });

  describe("animation is rapidly clicked", () => {
    it("opens down() even though the element is partially expanded due to double click on up()", (done) => {
      // Visible and with explicit height.
      document.body.innerHTML = `<div data-testid="content" style="display: block; height="50px;">Content!</div>`;
      const { element } = withMockAnimation(screen.getByTestId("content"));
      const { finish } = addMockAnimation(element, "0");

      // Will toggle down():
      toggle(element).then((opened) => {
        expect(opened).toBe(null);
        expect(finish).toHaveBeenCalledTimes(1);
        expect(element.style.display).toEqual("block");

        done();
      });
    });

    it("closes up() even though the element is partially expanded due to double click on down()", (done) => {
      // Visible and with explicit height.
      document.body.innerHTML = `<div data-testid="content" style="display: block; height="50px;">Content!</div>`;
      const { element } = withMockAnimation(screen.getByTestId("content"));
      const { finish } = addMockAnimation(element, "1");

      // Will toggle down():
      toggle(element).then((opened) => {
        expect(opened).toBe(null);
        expect(finish).toHaveBeenCalledTimes(1);
        expect(element.style.display).toEqual("none");

        done();
      });
    });
  });
});

describe("custom options", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div data-testid="content" style="display: none;">Content!</div>`;
  });

  it("uses default display value", (done) => {
    const { element } = withMockAnimation(screen.getByTestId("content"));
    expect(element.style.display).toEqual("none");

    down(element).then(() => {
      expect(element.style.display).toEqual("block");

      done();
    });
  });

  it("uses custom display property", (done) => {
    const { element } = withMockAnimation(screen.getByTestId("content"));
    expect(element.style.display).toEqual("none");

    down(element, { display: "flex" }).then(() => {
      expect(element.style.display).toEqual("flex");

      done();
    });
  });
});

describe("accessibility settings", () => {
  it("disables animation when user prefers reduced motion", (done) => {
    const { element } = withMockAnimation(screen.getByTestId("content"));

    window.matchMedia = () => {
      return {
        matches: true,
      };
    };

    up(element).then(() => {
      expect(element.animate).toHaveBeenCalledWith(expect.anything(), {
        duration: 0,
        easing: "ease",
        fill: "backwards",
      });
      done();
    });
  });
});

describe("overflow handling", () => {
  it("temporarily sets overflow to hidden", (done) => {
    document.body.innerHTML = `<div data-testid="content" style="display: none;">Content!</div>`;
    const { element } = withMockAnimation(screen.getByTestId("content"));

    expect(element.style.overflow).toEqual("");

    element.animate = () => {
      return {
        finished: new Promise((resolve) => {
          expect(element.style.overflow).toEqual("hidden");
          resolve();
        }),
      };
    };

    down(element).then(() => {
      expect(element.style.overflow).toEqual("");
      done();
    });
  });
});

describe("callback timing", () => {
  it("should fire callback after animation is complete", (done) => {
    document.body.innerHTML = `<div data-testid="content">Content!</div>`;
    const { element, getTimeCalled } = withMockAnimation(
      screen.getByTestId("content"),
      250
    );

    up(element).then(() => {
      const difference = new Date().getTime() - getTimeCalled();

      expect(difference).toBeGreaterThanOrEqual(250);
      done();
    });
  });
});
