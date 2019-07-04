class ContextLoggerPlugin {

  constructor() {
  }

  async env(ctx, next) {
    ctx.logger.state(getLogMetadata(ctx))
    await next()
  }

  async request(ctx, next) {
    ctx.logger.state(getLogMetadata(ctx))
    await next()
  }
}


// https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
function getLogMetadata(ctx) {
  if (!ctx.context) return { }
  return { 
    functionName: ctx.context.functionName || '',
    functionVersion: ctx.context.functionVersion || '',
    invokedQualifier: getQualifierFromArn(ctx.context.invokedFunctionArn),
    coldstart: getColdstartAsBoolean(ctx.state.coldstart),
    awsRequestId: ctx.context.awsRequestId || '',
    memoryLimitInMB: getMemoryLimitAsInteger(ctx.context.memoryLimitInMB) 
  }
}

// arn:aws:lambda:us-east-1:123456789012:function:helloStagedWorld:DEV
function getQualifierFromArn(arn) {
  if (!arn) return ''
  let parts = arn.split(':')
  return parts[parts.length-1]
}

function getColdstartAsBoolean(coldstart) {
  if (typeof coldstart !== 'boolean') return null
  return coldstart
}

function getMemoryLimitAsInteger(memoryLimitInMB) {
  if (!memoryLimitInMB) return -1
  return parseInt(memoryLimitInMB)
}

module.exports = ContextLoggerPlugin
