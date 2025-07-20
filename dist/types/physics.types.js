var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import Matter from 'matter-js';
// Type guard to check if a body is a RivePakBody
export function isRivePakBody(body) {
    return body &&
        typeof body === 'object' &&
        'plugin' in body &&
        body.plugin &&
        typeof body.plugin === 'object' &&
        'rivepak' in body.plugin;
}
// Type guard to check if a body is a wall
export function isWallBody(body) {
    return isRivePakBody(body) && body.plugin.rivepak.isWall === true;
}
// Get the canvas object from a physics body
export function getCanvasObject(body) {
    if (isRivePakBody(body)) {
        return body.plugin.rivepak.object;
    }
    return null;
}
// Default wall options
export const DEFAULT_WALL_OPTIONS = {
    isStatic: true,
    restitution: 1,
    friction: 0,
    frictionStatic: 0,
    frictionAir: 0,
    wallThickness: 0.035
};
// Helper to create a RivePak body
export function createRivePakBody(x, y, width, height, options = {}) {
    const { rivepakObject, isWall } = options, matterOptions = __rest(options, ["rivepakObject", "isWall"]);
    const body = Matter.Bodies.rectangle(x, y, width, height, Object.assign(Object.assign({}, matterOptions), { plugin: {
            rivepak: {
                object: rivepakObject || null,
                isWall: isWall || false
            }
        } }));
    return body;
}
// Extract collision data from Matter.js event
export function extractCollisionData(pair) {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;
    if (!isRivePakBody(bodyA) || !isRivePakBody(bodyB)) {
        return null;
    }
    const objectA = getCanvasObject(bodyA);
    const objectB = getCanvasObject(bodyB);
    // Skip if either is a wall (unless we want wall collisions)
    if (isWallBody(bodyA) || isWallBody(bodyB)) {
        return null;
    }
    const impactForce = Matter.Vector.magnitude(pair.collision.penetration);
    return {
        bodyA,
        bodyB,
        objectA,
        objectB,
        impactForce,
        collision: pair.collision
    };
}
