/* A self-contained teaching example; no network or host APIs. */
(function () {
  "use strict";
  var root = document.getElementById("llm-temperature-demo");
  if (!root) return;
  var input = root.querySelector("#llm-temperature-input");
  var value = root.querySelector("#llm-temperature-value");
  var status = root.querySelector("#llm-temperature-status");
  var logits = [2, 1, -1];
  function update() {
    var tau = Number(input.value);
    if (!Number.isFinite(tau) || tau <= 0) return;
    // Subtract the maximum logit for numerical stability.
    var weights = logits.map(function (z) { return Math.exp((z - 2) / tau); });
    var total = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
    value.textContent = tau.toFixed(2);
    weights.forEach(function (weight, index) {
      var percent = 100 * weight / total;
      root.querySelector('[data-prob-bar="' + index + '"]').style.width = percent + "%";
      root.querySelector('[data-prob-value="' + index + '"]').textContent = percent.toFixed(1) + "%";
    });
    status.textContent = tau < 1 ? "τ < 1，概率更集中，候选排序不变。" :
      tau > 1 ? "τ > 1，概率更分散，候选排序不变。" : "τ = 1，保留原始分布。数值为教学示例。";
  }
  input.addEventListener("input", update);
  update();
})();
