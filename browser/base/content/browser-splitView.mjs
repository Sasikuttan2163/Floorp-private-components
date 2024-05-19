/* -*- indent-tabs-mode: nil; js-indent-level: 2 -*- */

export const gSplitView = {
  Functions: {
    init() {
      gSplitView.Functions.tabContextMenu.addContextMenuToTabContext();
      Services.prefs.setBoolPref("floorp.browser.splitView.working", false);
    },
    setSplitView(tab, side) {
      try {
        this.removeSplitView();
      } catch (e) {}
      Services.prefs.setBoolPref("floorp.browser.splitView.working", true);

      let panel = gSplitView.Functions.getlinkedPanel(tab.linkedPanel);
      let browser = tab.linkedBrowser;
      let browserDocShellIsActiveState = browser.docShellIsActive;

      // Check if the a tab is already in split view
      let tabs = window.gBrowser.tabs;
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].hasAttribute("splitView")) {
          gSplitView.Functions.removeSplitView(tabs[i]);
        }
      }

      let CSSElem = document.getElementById("splitViewCSS");
      if (!CSSElem) {
        let elem = document.createElement("style");
        elem.setAttribute("id", "splitViewCSS");
        elem.textContent = `
        #tabbrowser-tabpanels > * {
          display: none;
        }
        
        .deck-selected {
          display: flex !important;
          flex: auto !important;
          order: 2;
        }
        
        .deck-selected[splitview="right"] {
          flex: auto !important;
          order: 4 !important;
        }

        .deck-selected[splitview="left"] {
          flex: auto !important;
          order: 0 !important;
        }

        #splitview-splitter {
          flex: 0 !important;
        }
        
        #tabbrowser-tabpanels {
          display: flex !important;
        }
        `;
        document.head.appendChild(elem);
      }

      tab.setAttribute("splitView", true);
      panel.setAttribute("splitview", side);
      panel.setAttribute("splitviewtab", true);
      panel.classList.add("deck-selected");

      this.splitter = document.createXULElement("splitter");
      this.splitter.setAttribute("id", "splitview-splitter");
      this.splitter.className = "deck-selected";
      document.querySelector("#tabbrowser-tabpanels").appendChild(this.splitter);

      if (side == "left") {
        document.getElementById("splitview-splitter").style.order = 1;
      } else if (side == "right") {
        document.getElementById("splitview-splitter").style.order = 3;
      }

      if (!browserDocShellIsActiveState) {
        browser.docShellIsActive = true;
      }

      gSplitView.Functions.setRenderLayersEvent();

      let currentSplitViewTab = document.querySelector(
        `.tabbrowser-tab[splitView="true"]`
      );
      let currentSplitViewPanel = gSplitView.Functions.getlinkedPanel(
        currentSplitViewTab?.linkedPanel
      );

      currentSplitViewPanel.style.width = `${document.getElementById("appcontent").clientWidth / 2 - 3}px`;
      Services.prefs.setIntPref("floorp.browser.splitView.width", currentSplitViewPanel.clientWidth / 2);

      const observer = new ResizeObserver(() => {
        let currentTab = window.gBrowser.selectedTab;
        if ((Services.prefs.getBoolPref("floorp.browser.splitView.working") === true) && (currentSplitViewTab !== currentTab)) {
          let width = window.gBrowser.getPanel().clientWidth;
          Services.prefs.setIntPref("floorp.browser.splitView.width", width);
        }
      });

      observer.observe(document.querySelector("#tabbrowser-tabpanels [splitviewtab = true]"));
    },

    removeSplitView() {
      Services.prefs.setBoolPref("floorp.browser.splitView.working", false);

      let tab = document.querySelector(`.tabbrowser-tab[splitView="true"]`);

      if (!tab) {
        return;
      }

      // remove style
      let panel = gSplitView.Functions.getlinkedPanel(tab.linkedPanel);
      let CSSElem = document.getElementById("splitViewCSS");
      CSSElem?.remove();

      document.querySelector("#splitview-splitter")?.remove();
      tab.removeAttribute("splitView");
      panel.removeAttribute("splitview");
      panel.removeAttribute("splitviewtab");
      panel.classList.remove("deck-selected");

      if (window.browser.docShellIsActive) {
        window.browser.docShellIsActive = false;
      }

      gSplitView.Functions.removeRenderLayersEvent();

      // set renderLayers to true & Set class to deck-selected
      window.gBrowser.selectedTab = tab;
    },

    getlinkedPanel(id) {
      let panel = document.getElementById(id);
      return panel;
    },

    setRenderLayersEvent() {
      document.addEventListener("floorpOnLocationChangeEvent", function () {
        let currentSplitViewTab = document.querySelector(
          `.tabbrowser-tab[splitView="true"]`
        );
        let currentSplitViewPanel = gSplitView.Functions.getlinkedPanel(
          currentSplitViewTab?.linkedPanel
        );
        if (currentSplitViewPanel !== window.gBrowser.getPanel()) {
          window.gBrowser.getPanel().style.width = Services.prefs.getIntPref("floorp.browser.splitView.width") + "px";
        }

        gSplitView.Functions.handleTabEvent();
      });
    },

    removeRenderLayersEvent() {
      let tabPanels = document.querySelectorAll("#tabbrowser-tabpanels > *");
      tabPanels.forEach((panel) => {
        panel.removeAttribute("width");
        panel.removeAttribute("style");
      });

      document.removeEventListener("floorpOnLocationChangeEvent");
    },

    handleTabEvent() {
      if (!Services.prefs.getBoolPref("floorp.browser.splitView.working")) {
        return;
      }

      let currentSplitViewTab = document.querySelector(
        `.tabbrowser-tab[splitView="true"]`
      );
      let currentSplitViewPanel = gSplitView.Functions.getlinkedPanel(
        currentSplitViewTab?.linkedPanel
      );
      let currentSplitViewBrowser = currentSplitViewTab?.linkedBrowser;

      if (!currentSplitViewBrowser) {
        return;
      }

      // set renderLayers to true & Set class to deck-selected
      currentSplitViewBrowser.renderLayers = true;
      currentSplitViewPanel?.classList.add("deck-selected");

      if (!currentSplitViewBrowser.docShellIsActive) {
        currentSplitViewBrowser.docShellIsActive = true;
      }

      function applySplitView() {
        currentSplitViewBrowser.renderLayers = true;
        currentSplitViewPanel?.classList.add("deck-selected");

        if (!window.browser.docShellIsActive) {
          window.browser.docShellIsActive = true;
        }
      }

      (function modifyDeckSelectedClass() {
        let tabs = window.gBrowser.tabs;
        for (let i = 0; i < tabs.length; i++) {
          let panel = gSplitView.Functions.getlinkedPanel(tabs[i].linkedPanel);
          if (
            tabs[i].hasAttribute("splitView") ||
            tabs[i] == window.gBrowser.selectedTab
          ) {
            panel?.classList.add("deck-selected");
          } else {
            panel?.classList.remove("deck-selected");
          }
        }
      })();

      window.setTimeout(applySplitView, 1000);
    },

    tabContextMenu: {
      addContextMenuToTabContext() {
        let beforeElem = document.getElementById("context_selectAllTabs");
        let menuitemElem = window.MozXULElement.parseXULToFragment(`
               <menu id="context_splitView" data-l10n-id="floorp-split-view-menu" accesskey="D">
                   <menupopup id="splitViewTabContextMenu"
                              onpopupshowing="gSplitView.Functions.tabContextMenu.onPopupShowing(event);"/>
               </menu>
               <menuitem id="splitViewTabContextMenuClose" data-l10n-id="splitview-close-split-tab"  oncommand="gSplitView.Functions.removeSplitView();"/>
               `);
        beforeElem.before(menuitemElem);
      },

      onPopupShowing(event) {
        //delete already exsist items
        let menuElem = document.getElementById("splitViewTabContextMenu");
        while (menuElem.firstChild) {
          menuElem.firstChild.remove();
        }

        //Rebuild context menu
        if (event.target === window.gBrowser.selectedTab) {
          let menuItem = window.MozXULElement.parseXULToFragment(`
                   <menuitem data-l10n-id="workspace-context-menu-selected-tab" disabled="true"/>
                  `);
          let parentElem = document.getElementById("workspaceTabContextMenu");
          parentElem.appendChild(menuItem);
          return;
        }

        let menuItem = window.MozXULElement.parseXULToFragment(`
                  <menuitem id="splitViewTabContextMenuLeft" data-l10n-id="splitview-show-on-left"  oncommand="gSplitView.Functions.setSplitView(TabContextMenu.contextTab, 'left');"/>
                  <menuitem id="splitViewTabContextMenuRight" data-l10n-id="splitview-show-on-right" oncommand="gSplitView.Functions.setSplitView(TabContextMenu.contextTab, 'right');"/>
                `);

        let parentElem = document.getElementById("splitViewTabContextMenu");
        parentElem.appendChild(menuItem);
      },

      setSplitView(event, side) {
        let tab = event.target;
        gSplitView.Functions.setSplitView(tab, side);
      },
    },
  },
};

gSplitView.Functions.init();
