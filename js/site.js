(function () {
  "use strict";

  var labels = {
    mainSkip: "跳到正文",
    tocSkip: "跳到目录",
    articleMeta: "文章信息",
    readingTimeTitle: "预计阅读时间",
    minuteRead: "约 {minutes} 分钟",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    postsCount: "{count} 篇",
    tocExpand: "展开",
    tocCollapse: "收起",
    zoomImage: "放大查看图片：{name}",
    imageViewer: "图片查看器",
    closeImage: "关闭图片",
    previousImage: "上一张图片",
    nextImage: "下一张图片",
    imagePosition: "{current} / {total}",
    backToTop: "返回顶部",
    copyCode: "复制代码",
    copy: "复制",
    copied: "已复制",
    copyFailed: "复制失败"
  };

  var format = function (template, values) {
    return template.replace(/\{(\w+)\}/g, function (_match, key) {
      return values[key];
    });
  };

  var icon = function (name) {
    var svg = {
      clock: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
      arrowUp: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path></svg>',
      copy: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
      check: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>',
      xmark: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
      chevronLeft: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>',
      chevronRight: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>',
      zoom: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><path d="M11 8v6"></path><path d="M8 11h6"></path></svg>'
    };

    return svg[name] || "";
  };

  var appendIcon = function (node, name) {
    var span = document.createElement("span");
    span.innerHTML = icon(name);
    if (span.firstChild) node.appendChild(span.firstChild);
  };

  var setIconLabel = function (node, iconName, text) {
    node.textContent = "";
    appendIcon(node, iconName);

    var label = document.createElement("span");
    label.className = "label";
    label.textContent = text;
    node.appendChild(label);
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
        var klass = (pre.getAttribute("class") || "").toLowerCase();
        var match = klass.match(/(?:^|\s)src-([a-z0-9_-]+)/);
        var aliases = {
          "c++": "cpp",
          "emacs-lisp": "lisp",
          elisp: "lisp",
          js: "javascript",
          sh: "bash",
          shell: "bash",
          yml: "yaml"
        };

        pre.setAttribute("class", klass);
        if (match && match[1]) {
          if (match[1] === "nil") {
            pre.classList.remove("src-nil");
          } else {
            var lang = aliases[match[1]] || match[1];
            pre.classList.add(lang);
            pre.classList.add("language-" + lang);
          }
        }

        if (window.hljs.highlightElement) {
          window.hljs.highlightElement(pre);
        } else {
          window.hljs.highlightBlock(pre);
        }
      });
    };
    document.head.appendChild(js);
  };

  var ensureMeta = function (selector, attr, name, content) {
    if (!content || document.head.querySelector(selector)) return;

    var tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    tag.setAttribute("content", content);
    document.head.appendChild(tag);
  };

  var setSocialMeta = function () {
    var title = document.title || "Kumu's Blog";
    var description = document.querySelector('meta[name="description"]');
    var descriptionText = description && description.getAttribute("content");

    ensureMeta('meta[property="og:title"]', "property", "og:title", title);
    if (descriptionText) {
      ensureMeta('meta[property="og:description"]', "property", "og:description", descriptionText);
      ensureMeta('meta[name="twitter:description"]', "name", "twitter:description", descriptionText);
    }
    ensureMeta('meta[name="twitter:title"]', "name", "twitter:title", title);

    if (window.location && /^https?:$/i.test(window.location.protocol)) {
      var url = String(window.location.href).split("#")[0];
      ensureMeta('meta[property="og:url"]', "property", "og:url", url);

      if (!document.head.querySelector('link[rel="canonical"]')) {
        var link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        link.setAttribute("href", url);
        document.head.appendChild(link);
      }
    }
  };

  var createSkipLink = function (href, text) {
    var link = document.createElement("a");
    link.className = "skip-link";
    link.href = href;
    link.textContent = text;
    return link;
  };

  var createFallbackNavbar = function () {
    var nav = document.createElement("nav");
    nav.className = "navbar";
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "主导航");

    var brand = document.createElement("a");
    brand.className = "navbar-brand";
    brand.href = "index.html";
    brand.textContent = "Kumu's Blog";
    nav.appendChild(brand);

    var links = document.createElement("div");
    links.className = "navbar-links";
    [
      ["Blog", "index.html", "blog"],
      ["Images", "gallery.html", "images"],
      ["Wiki", "https://wiki.opskumu.com"],
      ["Issues", "https://github.com/opskumu/issues"],
      ["GitHub", "https://github.com/opskumu"],
      ["About", "https://opskumu.com/"]
    ].forEach(function (item) {
      var link = document.createElement("a");
      link.textContent = item[0];
      link.href = item[1];
      if (item[2]) link.setAttribute("data-nav", item[2]);
      if (/^https?:\/\//.test(item[1])) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      links.appendChild(link);
    });

    nav.appendChild(links);
    return nav;
  };

  var initChrome = function () {
    var path = window.location.pathname;
    var isIndex = path === "/" || path === "/index.html" || path.endsWith("index.html");
    var isGallery = path.endsWith("gallery.html");

    if (isIndex) {
      document.body.classList.add("index-page");
    }

    if (!document.querySelector(".reading-progress")) {
      var progress = document.createElement("div");
      progress.className = "reading-progress";
      progress.setAttribute("aria-hidden", "true");
      document.body.insertBefore(progress, document.body.firstChild);
    }

    if (!document.querySelector(".navbar")) {
      document.body.insertBefore(createFallbackNavbar(), document.body.firstChild);
    }

    if (!document.querySelector('a.skip-link[href="#content"]')) {
      document.body.insertBefore(createSkipLink("#content", labels.mainSkip), document.body.firstChild);
    }

    var main = document.querySelector("#content");
    if (main && !main.getAttribute("role")) main.setAttribute("role", "main");

    if (document.querySelector("#table-of-contents")) {
      if (!document.querySelector('a.skip-link[href="#table-of-contents"]')) {
        var mainSkip = document.querySelector('a.skip-link[href="#content"]');
        var tocSkip = createSkipLink("#table-of-contents", labels.tocSkip);
        if (mainSkip && mainSkip.parentNode) {
          mainSkip.parentNode.insertBefore(tocSkip, mainSkip.nextSibling);
        } else {
          document.body.insertBefore(tocSkip, document.body.firstChild);
        }
      }
    } else {
      Array.prototype.forEach.call(document.querySelectorAll('a.skip-link[href="#table-of-contents"]'), function (link) {
        link.remove();
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".navbar-links a"), function (link) {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
      var nav = link.getAttribute("data-nav");
      if (nav === "blog" && !isGallery) {
        link.classList.add("active");
        link.setAttribute("aria-current", isIndex ? "page" : "location");
      } else if (nav === "images" && isGallery) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll(".content img"), function (img, index) {
      if (!img.getAttribute("loading")) {
        img.setAttribute("loading", index === 0 ? "eager" : "lazy");
      }
      if (index === 0 && !img.getAttribute("fetchpriority")) {
        img.setAttribute("fetchpriority", "high");
      }
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

    if (document.body.classList.contains("index-page") || document.body.classList.contains("gallery-page")) {
      postamble.textContent = "";
      postamble.classList.add("is-compact");
      if (creator) postamble.appendChild(creator);
      return;
    }

    if (!header || !title) {
      return;
    }

    var text = content.innerText || "";
    var chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    var englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    var readTime = Math.max(1, Math.ceil(chinese / 500 + englishWords / 220));

    var meta = document.createElement("div");
    meta.className = "article-meta";
    meta.setAttribute("aria-label", labels.articleMeta);

    var readingTime = document.createElement("span");
    readingTime.className = "reading-time";
    readingTime.title = labels.readingTimeTitle;
    appendIcon(readingTime, "clock");
    readingTime.appendChild(document.createTextNode(" " + format(labels.minuteRead, { minutes: readTime })));
    meta.appendChild(readingTime);

    if (author) {
      meta.appendChild(createMetaSeparator());
      meta.appendChild(author);
    }

    if (dateSpan) {
      meta.appendChild(createMetaSeparator());
      meta.appendChild(dateSpan);
    }

    title.insertAdjacentElement("afterend", meta);

    if (creator) {
      postamble.textContent = "";
      postamble.classList.add("is-compact");
      postamble.appendChild(creator);
    }
  };

  var createMetaSeparator = function () {
    var sep = document.createElement("span");
    sep.className = "article-meta-sep";
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = "/";
    return sep;
  };

  var initArchive = function () {
    if (!document.body.classList.contains("index-page")) return;

    var root = document.querySelector("#content");
    if (!root) return;

    var toolbar = document.createElement("div");
    toolbar.className = "archive-toolbar";

    var actions = document.createElement("div");
    actions.className = "archive-actions";
    [
      ["expand", labels.expandAll],
      ["collapse", labels.collapseAll]
    ].forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-action", item[0]);
      button.textContent = item[1];
      actions.appendChild(button);
    });
    toolbar.appendChild(actions);

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
      details.dataset.total = String(links);

      var summary = document.createElement("summary");

      var year = document.createElement("span");
      year.textContent = h3.textContent;

      var meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = format(labels.postsCount, { count: links });

      summary.appendChild(year);
      summary.appendChild(meta);

      details.appendChild(summary);
      details.appendChild(text);
      outline3.insertBefore(details, h3);
      h3.remove();
    });

    toolbar.addEventListener("click", function (event) {
      var target = event.target && event.target.closest ? event.target.closest("button[data-action]") : null;
      if (!target) return;

      var action = target.getAttribute("data-action");
      if (!action) return;

      Array.prototype.forEach.call(root.querySelectorAll("details.archive-year"), function (details) {
        details.open = action === "expand";
      });
    });
  };

  var initTocDisclosure = function () {
    var toc = document.querySelector("#table-of-contents");
    if (!toc) return;

    var heading = toc.querySelector("h2");
    var panel = toc.querySelector("#text-table-of-contents");
    if (!heading || !panel) return;

    if (!panel.id) panel.id = "text-table-of-contents";

    var headingText = document.createElement("span");
    headingText.className = "toc-heading-text";
    headingText.textContent = "目录";

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "toc-toggle";
    toggle.setAttribute("aria-controls", panel.id);

    heading.textContent = "";
    heading.appendChild(headingText);
    heading.appendChild(toggle);

    var narrow = window.matchMedia("(max-width: 1319px)");
    var collapsed = false;

    var render = function () {
      var collapsible = narrow.matches;
      toc.classList.toggle("is-collapsible", collapsible);
      if (!collapsible) collapsed = false;
      toc.classList.toggle("is-collapsed", collapsible && collapsed);
      panel.hidden = collapsible && collapsed;
      toggle.hidden = !collapsible;
      toggle.setAttribute("aria-expanded", String(!(collapsible && collapsed)));
      toggle.textContent = collapsible && collapsed ? labels.tocExpand : labels.tocCollapse;
    };

    collapsed = narrow.matches;
    render();

    toggle.addEventListener("click", function () {
      collapsed = !collapsed;
      render();
    });

    if (narrow.addEventListener) narrow.addEventListener("change", render);
    else if (narrow.addListener) narrow.addListener(render);
  };

  var initImageViewer = function () {
    if (typeof window.HTMLDialogElement !== "function") return;

    var images = Array.prototype.slice.call(document.querySelectorAll(".content figure img"));
    var items = images.filter(function (image) {
      return !image.closest("a, button");
    }).map(function (image) {
      var figure = image.closest("figure");
      var figureCaption = figure && figure.querySelector("figcaption");
      var captionLink = figureCaption && figureCaption.querySelector("a");
      var captionText = (captionLink && captionLink.textContent.trim()) ||
        (figureCaption && figureCaption.textContent.trim()) || "";

      return {
        image: image,
        caption: captionText,
        name: captionText || image.alt || "图片"
      };
    });
    if (!items.length) return;

    var dialog = document.createElement("dialog");
    dialog.className = "image-viewer";
    dialog.setAttribute("aria-label", labels.imageViewer);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "image-viewer-close";
    close.setAttribute("aria-label", labels.closeImage);
    appendIcon(close, "xmark");

    var previous = document.createElement("button");
    previous.type = "button";
    previous.className = "image-viewer-nav image-viewer-previous";
    previous.setAttribute("aria-label", labels.previousImage);
    appendIcon(previous, "chevronLeft");

    var next = document.createElement("button");
    next.type = "button";
    next.className = "image-viewer-nav image-viewer-next";
    next.setAttribute("aria-label", labels.nextImage);
    appendIcon(next, "chevronRight");

    var viewerImage = document.createElement("img");
    viewerImage.alt = "";

    var caption = document.createElement("p");
    caption.className = "image-viewer-caption";

    var position = document.createElement("p");
    position.className = "image-viewer-position";
    position.setAttribute("aria-live", "polite");

    dialog.appendChild(close);
    dialog.appendChild(previous);
    dialog.appendChild(next);
    dialog.appendChild(viewerImage);
    dialog.appendChild(caption);
    dialog.appendChild(position);
    document.body.appendChild(dialog);

    var currentIndex = 0;

    var showImage = function (index) {
      var item = items[index];
      if (!item) return;

      currentIndex = index;
      viewerImage.src = item.image.currentSrc || item.image.src;
      viewerImage.alt = item.image.alt || "";
      caption.textContent = item.caption;
      caption.hidden = !caption.textContent;
      position.textContent = format(labels.imagePosition, {
        current: index + 1,
        total: items.length
      });
      previous.disabled = index === 0;
      next.disabled = index === items.length - 1;
    };

    close.addEventListener("click", function () {
      dialog.close();
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    previous.addEventListener("click", function () {
      showImage(currentIndex - 1);
    });

    next.addEventListener("click", function () {
      showImage(currentIndex + 1);
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft" && !previous.disabled) {
        event.preventDefault();
        showImage(currentIndex - 1);
      } else if (event.key === "ArrowRight" && !next.disabled) {
        event.preventDefault();
        showImage(currentIndex + 1);
      }
    });

    items.forEach(function (item, index) {
      var image = item.image;
      var trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "image-zoom-trigger";
      trigger.setAttribute("aria-label", format(labels.zoomImage, { name: item.name }));

      image.parentNode.insertBefore(trigger, image);
      trigger.appendChild(image);

      var hint = document.createElement("span");
      hint.className = "image-zoom-hint";
      hint.setAttribute("aria-hidden", "true");
      appendIcon(hint, "zoom");
      trigger.appendChild(hint);

      trigger.addEventListener("click", function () {
        showImage(index);
        dialog.showModal();
      });
    });
  };

  var initScrollEnhancements = function () {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "fab-top";
    button.setAttribute("aria-label", labels.backToTop);
    appendIcon(button, "arrowUp");
    var hidden = document.createElement("span");
    hidden.className = "sr-only";
    hidden.textContent = labels.backToTop;
    button.appendChild(hidden);
    document.body.appendChild(button);

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    var bar = document.querySelector(".reading-progress");
    var raf = null;

    var update = function () {
      raf = null;
      if (window.scrollY > 600) button.classList.add("is-visible");
      else button.classList.remove("is-visible");

      if (bar) {
        var doc = document.documentElement;
        var scrollable = doc.scrollHeight - window.innerHeight;
        var percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
        bar.style.width = Math.max(0, Math.min(100, percent)) + "%";
      }
    };

    var onScroll = function () {
      if (raf !== null) return;
      raf = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
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
      container.classList.add("has-copy");

      var button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy-btn";
      button.setAttribute("aria-label", labels.copyCode);
      setIconLabel(button, "copy", labels.copy);

      button.addEventListener("click", function () {
        var text = pre.textContent || "";
        var done = function (ok) {
          button.classList.remove("is-copied", "is-error");
          if (ok) {
            button.classList.add("is-copied");
            setIconLabel(button, "check", labels.copied);
          } else {
            button.classList.add("is-error");
            setIconLabel(button, "xmark", labels.copyFailed);
          }

          window.setTimeout(function () {
            button.classList.remove("is-copied", "is-error");
            setIconLabel(button, "copy", labels.copy);
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
    initChrome();
    initReadingTime();
    initArchive();
    initTocDisclosure();
    initScrollEnhancements();
    initTocActiveState();
    initCodeCopy();
    initImageViewer();
  });
})();
