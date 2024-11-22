import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import Joi from 'joi';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
}).or('title', 'description');

// Create Task
export const createTask = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = JSON.parse(event.body ?? '{}');
    const { error } = createTaskSchema.validate(data);

    if (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: `Validation error: ${error.message}` }),
      };
    }

    const params = {
      TableName: tableName,
      Item: {
        taskId: uuidv4(),
        title: data.title,
        description: data.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await dynamoDb.put(params).promise();
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(params.Item),
    };
  } catch (error) {
    console.error('Create Task Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Could not create task' }),
    };
  }
};

// Get All Tasks
export const getTasks = async (): Promise<APIGatewayProxyResult> => {
  const params = {
    TableName: tableName,
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error('Get Tasks Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Could not retrieve tasks' }),
    };
  }
};

// Get Task by ID
export const getTaskById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { taskId } = event.pathParameters || {};

  if (!taskId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'taskId is required' }),
    };
  }

  const params = {
    TableName: tableName,
    Key: { taskId },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    if (result.Item) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Item),
      };
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Task not found' }),
      };
    }
  } catch (error) {
    console.error('Get Task by ID Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Could not retrieve task' }),
    };
  }
};

// Update Task
export const updateTask = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = JSON.parse(event.body ?? '{}');
    const { taskId } = event.pathParameters || {};

    if (!taskId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'taskId is required' }),
      };
    }

    const { error } = updateTaskSchema.validate(data);
    if (error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: `Validation error: ${error.message}` }),
      };
    }

    const params = {
      TableName: tableName,
      Key: { taskId },
      UpdateExpression: 'set #title = :title, #description = :description, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#description': 'description',
      },
      ExpressionAttributeValues: {
        ':title': data.title || '',
        ':description': data.description || '',
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDb.update(params).promise();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    console.error('Update Task Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Could not update task' }),
    };
  }
};

// Delete Task
export const deleteTask = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { taskId } = event.pathParameters || {};

  if (!taskId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'taskId is required' }),
    };
  }

  const params = {
    TableName: tableName,
    Key: { taskId },
  };

  try {
    await dynamoDb.delete(params).promise();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Task deleted successfully' }),
    };
  } catch (error) {
    console.error('Delete Task Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Could not delete task' }),
    };
  }
};
