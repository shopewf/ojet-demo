define(["require", "exports", "layouts/DemoCircleLayoutSupport"], function (require, exports, support) {
    "use strict";
    class DemoCircleLayout {
    }
    /**
     * Main function that does the circle layout (Layout entry point)
     * @param {DvtDiagramLayoutContext} layoutContext object that defines a context for layout call
     */
    DemoCircleLayout.circleLayout = (layoutContext) => {
        DemoCircleLayout.circleLayoutHelper(layoutContext);
    };
    /**
     * Circle layout function with layout arguments.
     * Used outside of ADF environment, when outside caller has to pass arguments to the layout.
     * @param {number} radius radius for the circle
     * @param {boolean} center true to have a center node
     * @param {string} anchor node id to use as a center
     * @param {string} sortAttr name of the sort attribute
     * @param {boolen} radialLabels true for curved labels
     * @param {boolean} curvedLinks true for curved links
     */
    DemoCircleLayout.circleLayoutWithLayoutArgs = (radius, center, anchor, sortAttr, radialLabels, curvedLinks) => {
        return (layoutContext) => {
            DemoCircleLayout.circleLayoutHelper(layoutContext, radius, center, anchor, sortAttr, radialLabels, curvedLinks);
        };
    };
    /**
     * Helper function that does the circle layout
     * @param {DvtDiagramLayoutContext} layoutContext object that defines a context for layout call
     * @param {number} radius radius for the circle
     * @param {boolean} center true to have a center node
     * @param {string} anchor node id to use as a center
     * @param {string} sortAttr name of the sort attribute
     * @param {boolen} radialLabels true for curved labels
     * @param {boolean} curvedLinks true for curved links
     */
    DemoCircleLayout.circleLayoutHelper = (layoutContext, radius, center, anchor, sortAttr, radialLabels, curvedLinks) => {
        const nodeCount = layoutContext.getNodeCount();
        if (center && !anchor) {
            for (let ni = 0; ni < nodeCount; ni++) {
                const node = layoutContext.getNodeByIndex(ni);
                if ("true" == node.getData()["anchor"]) {
                    anchor = node.getId();
                    break;
                }
            }
        }
        const maxNodeBounds = support.getMaxNodeBounds(layoutContext, radialLabels);
        const nodeSize = Math.max(maxNodeBounds.w, maxNodeBounds.h);
        if (nodeCount == 1) {
            support.centerNodeAndLabel(layoutContext, layoutContext.getNodeByIndex(0), 0, 0);
        }
        else {
            if (nodeCount == 2 && center) {
                center = false;
            }
            const angleStep = (2 * Math.PI) / (nodeCount - (center ? 1 : 0));
            const extraSpaceFactor = center ? 3 / nodeCount : 1 / nodeCount;
            radius = radius
                ? radius
                : ((1 + extraSpaceFactor) * nodeSize) /
                Math.sqrt(1 - Math.cos(angleStep));
            const sortedNodes = new Array();
            for (let ni = 0; ni < nodeCount; ni++) {
                const node = layoutContext.getNodeByIndex(ni);
                sortedNodes.push(node);
            }
            if (sortAttr) {
                sortedNodes.sort(support.getNodeComparator(sortAttr));
            }
            let max = nodeCount;
            let offset = 0;
            for (let ni = 0; ni < max; ni++) {
                const node = sortedNodes[ni];
                if (center && !anchor) {
                    anchor = node.getId();
                }
                if (center && node.getId() == anchor) {
                    support.centerNodeAndLabel(layoutContext, node, 0, 0);
                    offset = 1;
                    continue;
                }
                const angle = (ni - offset) * angleStep;
                const currX = radius * Math.cos(angle);
                const currY = radius * Math.sin(angle);
                if (radialLabels) {
                    support.centerNode(node, currX, currY);
                    DemoCircleLayout.positionRadialNodeLabel(layoutContext, node, angle, radius);
                }
                else {
                    support.centerNodeAndLabel(layoutContext, node, currX, currY);
                }
            }
        }
        if (curvedLinks) {
            DemoCircleLayout.layoutCurvedLinks(layoutContext);
        }
        else {
            support.layoutLinks(layoutContext);
        }
    };
    DemoCircleLayout.layoutCurvedLinks = (layoutContext) => {
        for (let li = 0; li < layoutContext.getLinkCount(); li++) {
            const link = layoutContext.getLinkByIndex(li);
            const endpoints = DemoCircleLayout.getCurvedEndpoints(layoutContext, link);
            const startX = endpoints[0].x;
            const startY = endpoints[0].y;
            const endX = endpoints[1].x;
            const endY = endpoints[1].y;
            // Quadratic Bezier through center of circle
            link.setPoints(["M", startX, startY, "Q", 0, 0, endX, endY]);
            // No label support for now
        }
    };
    DemoCircleLayout.getCurvedEndpoints = (layoutContext, link) => {
        const n1 = layoutContext.getNodeById(link.getStartId());
        const n2 = layoutContext.getNodeById(link.getEndId());
        const n1Position = n1.getPosition();
        const n2Position = n2.getPosition();
        const b1 = n1.getContentBounds();
        const b2 = n2.getContentBounds();
        const startX = n1Position.x + b1.x + 0.5 * b1.w;
        const startY = n1Position.y + b1.y + 0.5 * b1.h;
        const endX = n2Position.x + b2.x + 0.5 * b2.w;
        const endY = n2Position.y + b2.y + 0.5 * b2.h;
        const endpoints = [];
        endpoints.push({ x: startX, y: startY });
        endpoints.push({ x: endX, y: endY });
        return endpoints;
    };
    DemoCircleLayout.positionRadialNodeLabel = (layoutContext, node, angle, radius) => {
        const nodeLabelBounds = node.getLabelBounds();
        if (nodeLabelBounds) {
            const flipLabel = angle > 0.5 * Math.PI && angle < 1.5 * Math.PI;
            const nodeBounds = node.getBounds();
            const radiusPadding = (Math.max(nodeBounds.w, nodeBounds.h) * Math.sqrt(2)) / 2;
            const labelAttachPoint = {
                x: (radius + radiusPadding) * Math.cos(angle),
                y: (radius + radiusPadding) * Math.sin(angle),
            };
            const rotationPoint = {
                x: nodeLabelBounds.x + (flipLabel ? nodeLabelBounds.w : 0),
                y: nodeLabelBounds.y + 0.5 * nodeLabelBounds.h,
            };
            const labelPos = {
                x: labelAttachPoint.x - rotationPoint.x,
                y: labelAttachPoint.y - rotationPoint.y,
            };
            node.setLabelPosition(labelPos);
            node.setLabelRotationAngle(angle - (flipLabel ? Math.PI : 0));
            node.setLabelRotationPoint(rotationPoint);
        }
    };
    return DemoCircleLayout;
});