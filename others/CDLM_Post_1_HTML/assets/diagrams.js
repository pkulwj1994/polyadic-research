(function () {
  "use strict";
  const chinese = document.documentElement.lang.toLowerCase().startsWith("zh");
  const text = (en, zh) => chinese ? zh : en;

  function initGeneration(root) {
    if (root.dataset.demoReady) return;
    root.dataset.demoReady = "true";
    const play = root.querySelector("[data-demo-play]");
    const reset = root.querySelector("[data-demo-reset]");
    const count = root.querySelector("[data-demo-count]");
    const announcement = root.querySelector("[data-demo-announcement]");
    const lanes = [...root.querySelectorAll("[data-lane]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = null;
    let step = null;
    let playing = false;

    root.querySelector(".diagram-controls").hidden = false;

    function stop() {
      window.clearTimeout(timer);
      timer = null;
      playing = false;
    }

    function buttonLabel(label) {
      play.querySelector("span").textContent = label;
      play.setAttribute("aria-label", text(label + " in the schematic generation comparison", "生成方式对比：" + label));
      play.querySelector("svg").innerHTML = playing
        ? '<path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor"/>'
        : '<path d="M4 2.5 13 8 4 13.5Z" fill="currentColor"/>';
    }

    function render() {
      const resting = step === null;
      count.textContent = resting ? "" : text("Step " + step + " / 6", "第 " + step + " / 6 步");
      reset.disabled = resting;
      lanes.forEach(lane => {
        const kind = lane.dataset.lane;
        const status = lane.querySelector(".gen-status");
        if (resting) status.textContent = status.dataset.staticStatus;
        else if (kind === "ar") status.textContent = text(step + " of 6 tokens finalized", "已确定 " + step + " / 6 个 token");
        else if (kind === "whole") status.textContent = step === 6 ? text("6 tokens finalized", "6 个 token 已确定") : (step === 0 ? text("6 noisy vectors", "6 个带噪向量") : text("All 6 positions refining", "6 个位置共同细化"));
        else status.textContent = text(Math.floor(step / 2) + " of 3 blocks finalized", "已完成 " + Math.floor(step / 2) + " / 3 个块");

        lane.querySelectorAll(".gen-token").forEach(token => {
          const position = Number(token.dataset.position);
          let state = "done";
          let progress = 1;
          if (!resting && kind === "ar") state = position <= step ? "done" : "waiting";
          if (!resting && kind === "whole") {
            state = step === 6 ? "done" : step === 0 ? "waiting" : "refining";
            progress = step / 6;
          }
          if (!resting && kind === "block") {
            const group = Math.floor((position - 1) / 2);
            const localStep = step - group * 2;
            state = localStep >= 2 ? "done" : localStep > 0 ? "refining" : "waiting";
            progress = Math.max(0, Math.min(1, localStep / 2));
          }
          token.dataset.state = state;
          token.style.setProperty("--refine", String(progress));
          const isVector = !resting && kind !== "ar" && state !== "done";
          token.querySelector(".gen-symbol").innerHTML = (isVector ? "z" : "x") + "<sub>" + position + "</sub>";
        });
      });
    }

    function announce() {
      if (step === null) announcement.textContent = text("Static comparison restored.", "已恢复静态对比图。");
      else if (step === 6) announcement.textContent = text("Illustration complete. All three methods have produced six tokens. The steps shown are illustrative, not a speed comparison.", "演示结束。三种方式都已生成 6 个 token。步骤仅作示意，不用于比较速度。");
      else announcement.textContent = text("Step " + step + ". Autoregressive: " + step + " tokens finalized. Whole-sequence diffusion: all positions refining. Block diffusion: " + Math.floor(step / 2) + " blocks finalized.", "第 " + step + " 步。自回归：已确定 " + step + " 个 token。整段序列扩散：所有位置共同细化。分块扩散：已完成 " + Math.floor(step / 2) + " 个块。");
    }

    function tick() {
      if (!playing) return;
      step += 1;
      render();
      if (step === 6) {
        stop();
        buttonLabel(text("Replay", "重新播放"));
        announce();
      } else timer = window.setTimeout(tick, 900);
    }

    play.addEventListener("click", () => {
      if (playing) {
        stop();
        buttonLabel(text("Continue", "继续"));
        announce();
        return;
      }
      if (reducedMotion.matches) {
        step = 6;
        render();
        buttonLabel(text("Replay", "重新播放"));
        announcement.textContent = text("Reduced motion is enabled. The completed illustration is shown without animation.", "系统已启用减少动态效果，当前直接展示完成后的示意图。");
        return;
      }
      if (step === null || step === 6) step = 0;
      playing = true;
      render();
      buttonLabel(text("Pause", "暂停"));
      announcement.textContent = text("Playing the schematic generation comparison.", "正在播放生成方式对比示意图。");
      timer = window.setTimeout(tick, 650);
    });

    reset.addEventListener("click", () => {
      stop();
      step = null;
      render();
      buttonLabel(text("Play steps", "播放步骤"));
      announce();
    });

    window.addEventListener("beforeprint", () => {
      stop();
      step = null;
      render();
      buttonLabel(text("Play steps", "播放步骤"));
    });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches && playing) {
        stop();
        step = 6;
        render();
        buttonLabel(text("Replay", "重新播放"));
        announce();
      }
    });
  }

  function init() {
    document.querySelectorAll("[data-generation-demo]").forEach(initGeneration);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once: true});
  else init();
  window.CDLM_DIAGRAMS = {init};
}());
