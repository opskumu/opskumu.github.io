(function () {
  "use strict";

  var icon = function (name) {
    var svg = {
      clock: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
      arrowUp: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path></svg>',
      copy: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
      check: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>',
      xmark: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>'
    };

    return svg[name] || "";
  };

  var loadHighlight = function () {
    var blocks = Array.prototype.slice.call(document.querySelectorAll("pre.src"));
    if (!blocks.length) return;

    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "css/themes/googlecode.min.css";
    document.head.appendChild(css);

    var js = document.createElement("script");
    js.src = "js/highlight.min.js";
    js.onload = function () {
      if (!window.hljs) return;
      blocks.forEach(function (pre) {
        var klass = pre.getAttribute("class").toLowerCase();
        klass = klass.replace(/src-(\w+)/, "src-$1 $1");
        pre.setAttribute("class", klass);
        if (window.hljs.highlightElement) {
          window.hljs.highlightElement(pre);
        } else {
          window.hljs.highlightBlock(pre);
        }
      });
    };
    document.head.appendChild(js);
  };

  var setSocialMeta = function () {
    var head = document.head;
    var meta = function (attr, name, content) {
      if (!content) return;
      var tag = document.createElement("meta");
      tag.setAttribute(attr, name);
      tag.setAttribute("content", content);
      head.appendChild(tag);
    };

    var title = document.title || "Kumu's Blog";
    var description = document.querySelector('meta[name="description"]');
    var descriptionText = description && description.getAttribute("content");

    meta("property", "og:title", title);
    if (descriptionText) {
      meta("property", "og:description", descriptionText);
      meta("name", "twitter:description", descriptionText);
    }
    meta("name", "twitter:title", title);

    if (window.location && /^https?:$/i.test(window.location.protocol)) {
      var url = String(window.location.href).split("#")[0];
      meta("property", "og:url", url);

      var link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", url);
      head.appendChild(link);
    }
  };

  var insertChrome = function () {
    var path = window.location.pathname;
    if (path === "/" || path === "/index.html" || path.endsWith("index.html")) {
      document.body.classList.add("index-page");
    }

    var navPath = path.replace(/\/+$/, "");
    var blogActive = navPath === "" || navPath === "/" || navPath.endsWith("/index.html");
    var skip = '<a class="skip-link" href="#content">Skip to main content</a><a class="skip-link" href="#table-of-contents">Skip to table of contents</a>';
    var navbar = '<nav class="navbar" role="navigation" aria-label="Primary"><a class="navbar-brand" href="index.html">Kumu\'s Blog</a><div class="navbar-links"><a href="index.html"' + (blogActive ? ' class="active" aria-current="page"' : "") + '>Blog</a><a href="https://wiki.opskumu.com" target="_blank" rel="noopener noreferrer">Wiki</a><a href="https://github.com/opskumu/issues" target="_blank" rel="noopener noreferrer">Issues</a><a href="https://github.com/opskumu" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://opskumu.com/" target="_blank" rel="noopener noreferrer">About</a></div></nav>';

    document.body.insertAdjacentHTML("afterbegin", '<div class="reading-progress" aria-hidden="true"></div>' + skip + navbar);

    var main = document.querySelector("#content");
    if (main && !main.getAttribute("role")) main.setAttribute("role", "main");

    if (!document.querySelector("#table-of-contents")) {
      Array.prototype.forEach.call(document.querySelectorAll('a.skip-link[href="#table-of-contents"]'), function (link) {
        link.remove();
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".content img"), function (img) {
      if (!img.getAttribute("loading")) img.setAttribute("loading", "lazy");
      if (!img.getAttribute("decoding")) img.setAttribute("decoding", "async");
    });
  };

  var initReadingTime = function () {
    var content = document.querySelector("#content");
    var postamble = document.querySelector("#postamble");
    if (!content || !postamble) return;

    var author = postamble.querySelector(".author");
    var dateSpan = postamble.querySelector(".date");
    var creator = postamble.querySelector(".creator");
    var header = content.querySelector("header");
    var title = header ? header.querySelector(".title") : null;

    if (dateSpan) {
      var dateText = (dateSpan.textContent || "").replace(/\s+/g, " ").trim();
      var match = dateText.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) dateSpan.textContent = match[1];
    }

    if (document.body.classList.contains("index-page") || !header || !title) {
      return;
    }

    var text = content.innerText || "";
    var chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    var english = (text.match(/[a-zA-Z]+/g) || []).reduce(function (total, word) {
      return total + word.length;
    }, 0);
    var readTime = Math.max(1, Math.ceil((chinese + english) / 350));

    var meta = document.createElement("div");
    meta.className = "article-meta";
    meta.setAttribute("aria-label", "Article metadata");
    meta.innerHTML = '<span class="reading-time" title="Estimated reading time">' + icon("clock") + " " + readTime + ' min read</span>';

    if (author) {
      meta.insertAdjacentHTML("beforeend", '<span class="article-meta-sep" aria-hidden="true">/</span>');
      meta.appendChild(author);
    }

    if (dateSpan) {
      meta.insertAdjacentHTML("beforeend", '<span class="article-meta-sep" aria-hidden="true">/</span>');
      meta.appendChild(dateSpan);
    }

    title.insertAdjacentElement("afterend", meta);

    if (creator) {
      postamble.textContent = "";
      postamble.classList.add("is-compact");
      postamble.appendChild(creator);
    }
  };

  var initArchive = function () {
    if (!document.body.classList.contains("index-page")) return;

    var root = document.querySelector("#content");
    if (!root) return;

    var toolbar = document.createElement("div");
    toolbar.className = "archive-toolbar";
    toolbar.innerHTML = '<button type="button" data-action="expand">Expand all</button><button type="button" data-action="collapse">Collapse all</button>';

    var archiveHeader = root.querySelector("h2");
    if (archiveHeader && archiveHeader.parentElement) {
      archiveHeader.parentElement.insertBefore(toolbar, archiveHeader.nextSibling);
    }

    var yearHeadings = Array.prototype.slice.call(root.querySelectorAll(".outline-3 > h3"));
    yearHeadings.forEach(function (h3) {
      var outline3 = h3.parentElement;
      var text = outline3 ? outline3.querySelector(".outline-text-3") : null;
      if (!outline3 || !text) return;

      var links = text.querySelectorAll("a").length;
      var details = document.createElement("details");
      details.className = "archive-year";
      details.open = true;

      var summary = document.createElement("summary");
      summary.innerHTML = "<span>" + h3.textContent + '</span><span class="meta">' + links + " post" + (links === 1 ? "" : "s") + "</span>";

      details.appendChild(summary);
      details.appendChild(text);
      outline3.insertBefore(details, h3);
      h3.remove();
    });

    toolbar.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;

      var action = target.getAttribute("data-action");
      if (!action) return;

      Array.prototype.forEach.call(root.querySelectorAll("details.archive-year"), function (details) {
        details.open = action === "expand";
      });
    });
  };

  var initBackToTop = function () {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "fab-top";
    button.setAttribute("aria-label", "Back to top");
    button.innerHTML = icon("arrowUp") + '<span class="sr-only">Back to top</span>';
    document.body.appendChild(button);

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    var onScroll = function () {
      if (window.scrollY > 600) button.classList.add("is-visible");
      else button.classList.remove("is-visible");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  var initReadingProgress = function () {
    var bar = document.querySelector(".reading-progress");
    if (!bar) return;

    var onScroll = function () {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, percent)) + "%";
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  };

  var initTocActiveState = function () {
    var toc = document.querySelector("#table-of-contents");
    if (!toc) return;

    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    var byId = new Map();
    links.forEach(function (link) {
      var id = (link.getAttribute("href") || "").slice(1);
      if (!id) return;

      var target = document.getElementById(id);
      if (target) byId.set(target, link);
    });

    if (!("IntersectionObserver" in window) || byId.size === 0) return;

    var clear = function () {
      links.forEach(function (link) {
        link.classList.remove("active");
      });
    };

    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) {
        return entry.isIntersecting;
      }).sort(function (a, b) {
        return b.intersectionRatio - a.intersectionRatio;
      })[0];

      if (!visible) return;

      var link = byId.get(visible.target);
      if (!link) return;

      clear();
      link.classList.add("active");
    }, { rootMargin: "-20% 0px -70% 0px", threshold: [0.01, 0.1, 0.25, 0.5] });

    byId.forEach(function (_link, element) {
      observer.observe(element);
    });
  };

  var initCodeCopy = function () {
    var blocks = Array.prototype.slice.call(document.querySelectorAll(".org-src-container > pre.src"));
    if (!blocks.length) return;

    var fallbackCopy = function (text) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();

      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (_error) {
        ok = false;
      }
      document.body.removeChild(textarea);
      return ok;
    };

    blocks.forEach(function (pre) {
      var container = pre.parentElement;
      if (!container || container.querySelector(".code-copy-btn")) return;

      var button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy-btn";
      button.setAttribute("aria-label", "Copy code block");
      button.innerHTML = icon("copy") + '<span class="label">Copy</span>';

      button.addEventListener("click", function () {
        var text = pre.innerText || pre.textContent || "";
        var done = function (ok) {
          button.classList.remove("is-copied", "is-error");
          if (ok) {
            button.classList.add("is-copied");
            button.innerHTML = icon("check") + '<span class="label">Copied</span>';
          } else {
            button.classList.add("is-error");
            button.innerHTML = icon("xmark") + '<span class="label">Failed</span>';
          }

          window.setTimeout(function () {
            button.classList.remove("is-copied", "is-error");
            button.innerHTML = icon("copy") + '<span class="label">Copy</span>';
          }, 1400);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            done(true);
          }).catch(function () {
            done(fallbackCopy(text));
          });
        } else {
          done(fallbackCopy(text));
        }
      });

      container.appendChild(button);
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    loadHighlight();
    setSocialMeta();
    insertChrome();
    initReadingTime();
    initArchive();
    initBackToTop();
    initReadingProgress();
    initTocActiveState();
    initCodeCopy();
  });
})();
