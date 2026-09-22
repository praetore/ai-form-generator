import type {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {
  buttonId,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId,
} from '@rjsf/utils';

function isObjectProperty(
  schema: RJSFSchema | boolean | undefined,
): boolean {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    (schema.type === 'object' || !!schema.properties)
  );
}

export default function ObjectFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = Record<string, unknown>,
>({
  description,
  title,
  properties,
  required,
  uiSchema,
  fieldPathId,
  schema,
  formData,
  optionalDataControl,
  onAddProperty,
  disabled,
  readonly,
  registry,
}: ObjectFieldTemplateProps<T, S, F>) {
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>(
    'TitleFieldTemplate',
    registry,
    uiOptions,
  );
  const DescriptionFieldTemplate = getTemplate<
    'DescriptionFieldTemplate',
    T,
    S,
    F
  >('DescriptionFieldTemplate', registry, uiOptions);
  const showOptionalDataControlInTitle = !readonly && !disabled;
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  return (
    <div className="flex flex-col gap-6">
      {title && (
        <TitleFieldTemplate
          id={titleId(fieldPathId)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          optionalDataControl={
            showOptionalDataControlInTitle ? optionalDataControl : undefined
          }
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId(fieldPathId)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <div className="flex flex-col gap-5">
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {properties.map((element) => {
          const propertySchema = schema.properties?.[element.name];
          const isBlock = isObjectProperty(propertySchema);

          return (
            <div
              key={element.name}
              className={`${element.hidden ? 'hidden' : 'flex'} ${
                isBlock
                  ? 'rounded-lg border border-border bg-muted/30 p-4 sm:p-5'
                  : ''
              }`}
            >
              <div className="w-full">{element.content}</div>
            </div>
          );
        })}
        {canExpand(schema, uiSchema, formData) ? (
          <div className="mt-2 flex justify-end">
            <AddButton
              id={buttonId(fieldPathId, 'add')}
              onClick={onAddProperty}
              disabled={disabled || readonly}
              className="rjsf-object-property-expand"
              uiSchema={uiSchema}
              registry={registry}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
