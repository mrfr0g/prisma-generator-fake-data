"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generator_helper_1 = require("@prisma/generator-helper");
const constants_1 = require("./constants");
const createMethods_1 = require("./helpers/createMethods");
const writeFileSafely_1 = require("./utils/writeFileSafely");
const { version } = require('../package.json');
(0, generator_helper_1.generatorHandler)({
    onManifest() {
        return {
            version,
            defaultOutput: './fake-data.ts',
            prettyName: constants_1.GENERATOR_NAME,
            requiresGenerators: ['prisma-client-js'],
        };
    },
    async onGenerate(options) {
        var _a;
        const fakeMethods = await (0, createMethods_1.createMethods)(options.dmmf.datamodel, options.generator.config.extraImport, options.generator.config.extraExport);
        await (0, writeFileSafely_1.writeFileSafely)((_a = options.generator.output) === null || _a === void 0 ? void 0 : _a.value, fakeMethods);
    },
});
//# sourceMappingURL=generator.js.map