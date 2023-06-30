"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMethods = void 0;
const internals_1 = require("@prisma/internals");
function getFieldDefinition(models, model, field, enums) {
    var _a, _b, _c, _d, _e;
    const docLines = ((_a = field.documentation) === null || _a === void 0 ? void 0 : _a.split('\n')) || [];
    const fakeLine = docLines.find((line) => line.startsWith('FAKE:'));
    const fakeValue = fakeLine === null || fakeLine === void 0 ? void 0 : fakeLine.replace('FAKE:', '');
    if (field.isId) {
        return `${field.name}: ${field.type === 'String' ? 'faker.datatype.uuid()' : 'faker.number.int()'}`;
    }
    if (field.hasDefaultValue) {
        if (field.isList) {
            return `${field.name}: ${((_b = field.default) === null || _b === void 0 ? void 0 : _b.toString()) || '[]'}`;
        }
        if (['Json'].includes(field.type)) {
            return `${field.name}: ${fakeValue || ((_c = field.default) === null || _c === void 0 ? void 0 : _c.toString()) || '{}'}`;
        }
        if (field.kind === 'enum') {
            return `${field.name}: ${field.type}.${field.default}`;
        }
        if (['Int', 'BigInt', 'Float', 'Decimal', 'Boolean'].includes(field.type)) {
            return `${field.name}: ${field.default}`;
        }
        if (['String'].includes(field.type)) {
            return `${field.name}: '${field.default}'`;
        }
        if (field.type === 'DateTime') {
            return `${field.name}: new Date()`;
        }
    }
    if (!field.isRequired) {
        if (field.type === 'String') {
            const rand = Math.floor(Math.random() * 100);
            const numWords = Math.min(5, Math.floor(Math.random() * 10));
            return `${field.name}: ${rand < 50 ? null : `faker.lorem.words(${numWords})`}`;
        }
        return `${field.name}: null`;
    }
    if (field.kind === 'enum') {
        const enumName = field.type;
        const enumValues = ((_d = enums.find((it) => it.name === enumName)) === null || _d === void 0 ? void 0 : _d.values) || [];
        if (enumValues.length === 0) {
            internals_1.logger.warn(`Enum ${enumName} has no enum values. Field ${field.name} won't be generated.`);
        }
        else {
            const enumValuesAsString = enumValues
                .map((v) => `${enumName}.${v.name}`)
                .join(', ');
            return `${field.name}: faker.helpers.arrayElement([${enumValuesAsString}] as const)`;
        }
    }
    if (model.fields.some((it) => { var _a; return (_a = it.relationFromFields) === null || _a === void 0 ? void 0 : _a.includes(field.name); })) {
        return `${field.name}: ${field.type === 'String' ? 'faker.datatype.uuid()' : 'faker.number.int()'}`;
    }
    if (field.type === 'String') {
        if (field.isList) {
            return `${field.name}: faker.lorem.words(5).split(' ')`;
        }
        if (field.name === 'email') {
            return `${field.name}: faker.internet.email()`;
        }
        if (field.name === 'name') {
            return `${field.name}: faker.name.fullName()`;
        }
        if (field.name === 'firstName') {
            return `${field.name}: faker.name.firstName()`;
        }
        if (field.name === 'lastName') {
            return `${field.name}: faker.name.lastName()`;
        }
        return `${field.name}: faker.lorem.words(5)`;
    }
    if (field.type === 'Int' || field.type === 'BigInt') {
        if (field.isList) {
            return `${field.name}: [faker.number.int(),faker.number.int(),faker.number.int(),faker.number.int(),faker.number.int()]`;
        }
        if (field.name === 'age') {
            return `${field.name}: faker.datatype.int({min: 0, max: 99})`;
        }
        return `${field.name}: faker.number.int()`;
    }
    if (field.type === 'Float') {
        if (field.isList) {
            return `${field.name}: [faker.datatype.float(),faker.datatype.float(),faker.datatype.float(),faker.datatype.float(),faker.datatype.float()]`;
        }
        return `${field.name}: faker.datatype.float()`;
    }
    if (field.type === 'Boolean') {
        if (field.isList) {
            return `${field.name}: [faker.datatype.boolean(),faker.datatype.boolean(),faker.datatype.boolean(),faker.datatype.boolean(),faker.datatype.boolean()]`;
        }
        return `${field.name}: faker.datatype.boolean()`;
    }
    if (field.type === 'Decimal') {
        if (field.isList) {
            return `${field.name}: [faker.datatype.hexaDecimal(),faker.datatype.hexaDecimal(),faker.datatype.hexaDecimal(),faker.datatype.hexaDecimal(),faker.datatype.hexaDecimal()]`;
        }
        return `${field.name}: faker.datatype.hexaDecimal()`;
    }
    if (field.type === 'DateTime') {
        if (field.isList) {
            return `${field.name}: [faker.datatype.datetime(),faker.datatype.datetime(),faker.datatype.datetime(),faker.datatype.datetime(),faker.datatype.datetime()]`;
        }
        return `${field.name}: faker.datatype.datetime()`;
    }
    if (field.type === 'Json') {
        const docLines = ((_e = field.documentation) === null || _e === void 0 ? void 0 : _e.split('\n')) || [];
        const fake = docLines.find((line) => line.startsWith('FAKE:'));
        if (fake) {
            const fakeValue = fake.replace('FAKE:', '');
            if (!fakeValue) {
                internals_1.logger.warn(`Incorrect format for fake JSON. Field ${field.name} won't be generated. Example: ///[FAKE:{"test": "faker.lorem.word()"}]`);
                return null;
            }
            return `${field.name}: ${fakeValue}`;
        }
        return `${field.name}: JSON.parse(faker.datatype.json())`;
    }
    internals_1.logger.warn(`Type ${field.type}${field.isList ? '[]' : ''} (${field.kind}) is not supported. Field ${field.name} won't be generated.`);
    return null;
}
async function createMethods({ enums, models }, extraImport, extraExport) {
    const functions = [];
    models.forEach((m) => {
        createFakeFunctionsWithoutFKs(models, m, enums, functions);
        createFakeFunctionsWithFKs(models, m, enums, functions);
    });
    const enumNames = enums.map((it) => it.name).join(', ');
    return await `import { ${enumNames} } from '@prisma/client';
import { faker } from '@faker-js/faker';
${extraImport || ''}
${extraExport || ''}

${functions.join('\n')}
`;
}
exports.createMethods = createMethods;
function createFakeFunctionsWithoutFKs(models, model, enums, functions) {
    const validFields = model.fields
        .filter((field) => !field.isId)
        .filter((field) => field.kind === 'scalar' || field.kind === 'enum')
        .filter((field) => {
        return !model.fields.find((it) => {
            var _a;
            return (_a = it.relationFromFields) === null || _a === void 0 ? void 0 : _a.includes(field.name);
        });
    })
        .filter((field) => !field.hasDefaultValue)
        .map((f) => getFieldDefinition(models, model, f, enums))
        .filter(Boolean);
    if (validFields.length > 0) {
        functions.push(`export function fake${model.name}() {
  return {
    ${validFields.join(',\n    ')},
  };
}`);
    }
}
function createFakeFunctionsWithFKs(models, model, enums, functions) {
    const validFields = model.fields
        .filter((field) => field.kind === 'scalar' || field.kind === 'enum')
        .map((f) => getFieldDefinition(models, model, f, enums))
        .filter(Boolean);
    if (validFields.length > 0) {
        functions.push(`export function fake${model.name}Complete() {
  return {
    ${validFields.join(',\n    ')},
  };
}`);
    }
}
//# sourceMappingURL=createMethods.js.map