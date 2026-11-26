export const InjectRepository = (): ParameterDecorator => () => undefined;
export const getRepositoryToken = (entity: { name?: string } | string) =>
  `${typeof entity === 'string' ? entity : entity?.name || 'Entity'}Repository`;
