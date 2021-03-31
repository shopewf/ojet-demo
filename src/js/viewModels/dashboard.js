/**
 * @license
 * Copyright (c) 2014, 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
/*
 * Your dashboard ViewModel code goes here
 */
define(['accUtils', 'require', 'exports', 'knockout', 'text!data/dndDataSample.json',
        'ojs/ojarraydataprovider', 'ojs/ojattributegrouphandler', 'ojs/ojdiagram-utils', 'layouts/DemoGridLayout'],
 function(accUtils, require, exports, ko, data, ArrayDataProvider, ojattributegrouphandler, ojdiagram_utils, layout) {
    function DashboardViewModel() {
      // Below are a set of the ViewModel methods invoked by the oj-module component.
      // Please reference the oj-module jsDoc for additional information.

      var self = this;

      this.data = JSON.parse(data)
      this.colorHandler = new ojattributegrouphandler.ColorAttributeGroupHandler();
      this.nodes1 = ko.observableArray(this.data.nodesA);
      this.nodes2 = ko.observableArray(this.data.nodesB);
      this.links2 = ko.observableArray(this.data.linksB);
      this.nodeDataProvider1 = new ArrayDataProvider(this.nodes1, {
        keyAttributes: "id",
      });
      this.nodeDataProvider2 = new ArrayDataProvider(this.nodes2, {
        keyAttributes: "id",
      });
      this.linkDataProvider2 = new ArrayDataProvider(this.links2, {
        keyAttributes: "id",
      });
      this.onDrop = (event, context, nodes, linkCleanUp) => {
        const diagramData = event.dataTransfer.getData("text/nodes1") ||
            event.dataTransfer.getData("text/nodes2");
        let newNodeId;
        // create new node
        if (diagramData) {
          const dataContext = JSON.parse(diagramData)[0];
          //remove specific node from from it's current location
          this.nodes1.remove((s) => {
            return s.id === dataContext.id;
          });
          this.nodes2.remove((s) => {
            return s.id === dataContext.id;
          });
          if (linkCleanUp)
            this.links2.remove((s) => {
              return s.start === dataContext.id || s.endNode === dataContext.id;
            });
          //add node to the target
          dataContext.itemData.x = context.nodeContext
              ? context.x + 100
              : context.x;
          dataContext.itemData.y = context.y;
          newNodeId = dataContext.itemData.id;
          nodes.push(dataContext.itemData);
        }
        if (context.nodeContext) {
          const startNodeId = context.nodeContext.id;
          this.links2.push({
            id: "L" + startNodeId + "_" + newNodeId,
            startNode: startNodeId,
            endNode: newNodeId,
          });
        }
        else if (context.linkContext) {
          const linkId = context.linkContext.id, startNode = context.linkContext.data.startNode, endNode = context.linkContext.data.endNode;
          this.links2.remove((s) => {
            return s.id === linkId;
          });
          this.links2.push({
            id: "L" + startNode + "_" + newNodeId,
            startNode: startNode,
            endNode: newNodeId,
          });
          this.links2.push({
            id: "L" + newNodeId + "_" + endNode,
            startNode: newNodeId,
            endNode: endNode,
          });
        }
      };
      this.labelLayoutFunc = (layoutContext, node) => {
        const nodeBounds = node["getContentBounds"]();
        const nodePos = node["getPosition"]();
        const labelLayout = {
          x: nodeBounds.x + nodePos.x + 0.5 * nodeBounds.w,
          y: nodeBounds.y + nodePos.y + 1.2 * nodeBounds.h,
          halign: "center",
          valign: "middle",
        };
        return labelLayout;
      };
      this.linkPathFunc = (layoutContext, link) => {
        const node1 = layoutContext.getNodeById(link["getStartId"]());
        const node2 = layoutContext.getNodeById(link["getEndId"]());
        const n1Pos = node1.getPosition(), n2Pos = node2.getPosition();
        const n1Bounds = node1.getBounds(), n2Bounds = node2.getBounds();
        const startX = n1Pos.x + 0.5 * n1Bounds.w;
        const startY = n1Pos.y + 0.5 * n1Bounds.h;
        const endX = n2Pos.x + 0.5 * n2Bounds.w;
        const endY = n2Pos.y + 0.5 * n2Bounds.h;
        return [startX, startY, endX, endY].toString();
      };
      this.onDrop1 = (event, context) => {
        this.onDrop(event, context, this.nodes1, true);
      };
      this.onDrop2 = (event, context) => {
        this.onDrop(event, context, this.nodes2, false);
      };
      this.onLinkDrop = (event, context) => {
        this.onDrop(event, context, this.nodes2, false);
      };
      this.gridLayout = layout.gridLayout();
      this.dropLayout = ko.pureComputed(() => {
        return ojdiagram_utils.getLayout({
          nodes: this.nodes2(),
          links: this.links2(),
          nodeDefaults: { labelLayout: this.labelLayoutFunc },
          linkDefaults: { path: this.linkPathFunc },
          viewport: (layoutContext) => {
            if (layoutContext.getCurrentViewport()) {
              return layoutContext.getCurrentViewport();
            }
            else
              return layoutContext.getComponentSize();
          },
        });
      });

      /**
       * Optional ViewModel method invoked after the View is inserted into the
       * document DOM.  The application can put logic that requires the DOM being
       * attached here.
       * This method might be called multiple times - after the View is created
       * and inserted into the DOM and after the View is reconnected
       * after being disconnected.
       */
      this.connected = () => {
        accUtils.announce('Dashboard page loaded.');
        document.title = "Dashboard";
        // Implement further logic if needed
      };

      /**
       * Optional ViewModel method invoked after the View is disconnected from the DOM.
       */
      this.disconnected = () => {
        // Implement if needed
      };

      /**
       * Optional ViewModel method invoked after transition to the new View is complete.
       * That includes any possible animation between the old and the new View.
       */
      this.transitionCompleted = () => {
        // Implement if needed
      };
    }

    /*
     * Returns an instance of the ViewModel providing one instance of the ViewModel. If needed,
     * return a constructor for the ViewModel so that the ViewModel is constructed
     * each time the view is displayed.
     */
    return DashboardViewModel;
  }
);
