const { db } = require('../db');

/**
 * Service for tracking and retrieving API metrics
 */
class MetricsService {
  /**
   * Increments the total request count for today
   */
  async incrementTotalRequests() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    try {
      // Check if there's an entry for today
      const row = await this.getOrCreateTodayMetrics();
      
      // Increment total requests
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE api_metrics SET total_requests = total_requests + 1 WHERE date = ?',
          [today],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing total requests:', error);
      return false;
    }
  }

  /**
   * Increments the copyright error count for today
   */
  async incrementCopyrightErrors() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    try {
      // Check if there's an entry for today
      const row = await this.getOrCreateTodayMetrics();
      
      // Increment copyright errors
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE api_metrics SET copyright_errors = copyright_errors + 1 WHERE date = ?',
          [today],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      return true;
    } catch (error) {
      console.error('Error incrementing copyright errors:', error);
      return false;
    }
  }

  /**
   * Records token usage for an API request
   * @param {Object} requestData - Request data including model, tokens, and error information
   */
  async recordApiRequest(requestData) {
    try {
      const { 
        model = '',
        inputTokens = 0,
        outputTokens = 0,
        errorType = null,
        responseTime = 0
      } = requestData;
      
      const totalTokens = inputTokens + outputTokens;
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO api_requests (
            timestamp, model, input_tokens, output_tokens, 
            total_tokens, error_type, response_time
          ) VALUES (datetime('now'), ?, ?, ?, ?, ?, ?)`,
          [model, inputTokens, outputTokens, totalTokens, errorType, responseTime],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      return true;
    } catch (error) {
      console.error('Error recording API request metrics:', error);
      return false;
    }
  }

  /**
   * Gets or creates metrics entry for today
   */
  async getOrCreateTodayMetrics() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    
    try {
      // Check if there's an entry for today
      const row = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM api_metrics WHERE date = ?',
          [today],
          function(err, row) {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      // If no entry for today, create one
      if (!row) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO api_metrics (date, total_requests, copyright_errors, uptime_start) SELECT ?, 0, 0, (SELECT uptime_start FROM api_metrics ORDER BY id ASC LIMIT 1)',
            [today],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        
        // Get the created row
        return await this.getOrCreateTodayMetrics();
      }
      
      return row;
    } catch (error) {
      console.error('Error getting or creating today metrics:', error);
      return null;
    }
  }

  /**
   * Gets dashboard metrics including total requests, copyright errors, and uptime
   */
  async getDashboardMetrics() {
    try {
      // Get total requests, copyright errors and server start time
      const metrics = await new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            SUM(total_requests) as total_requests,
            SUM(copyright_errors) as copyright_errors,
            MIN(uptime_start) as uptime_start
          FROM api_metrics`,
          function(err, row) {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      // Calculate uptime in seconds
      let uptimeSeconds = 0;
      if (metrics && metrics.uptime_start) {
        const startTime = new Date(metrics.uptime_start);
        const currentTime = new Date();
        uptimeSeconds = Math.floor((currentTime - startTime) / 1000);
      }
      
      // Get token usage statistics
      const tokenStats = await this.getTokenUsageStats();
      
      // Get 24-hour request count
      const last24HoursRequests = await this.getLast24HoursRequestsCount();
      
      // Get hourly data for charts
      const hourlyData = await this.getHourlyData();
      
      // Get daily trend data for charts
      const dailyTrends = await this.getDailyTrends();
      
      return {
        totalRequests: metrics?.total_requests || 0,
        copyrightErrors: metrics?.copyright_errors || 0,
        uptimeSeconds: uptimeSeconds,
        uptime: this.formatUptime(uptimeSeconds),
        totalTokens: tokenStats.totalTokens,
        avgTokensPerRequest: tokenStats.avgTokensPerRequest,
        last24HoursRequests: last24HoursRequests,
        hourlyRequests: hourlyData.hourlyRequests,
        hourlyTokens: hourlyData.hourlyTokens,
        dailyRequestTrend: dailyTrends.requests,
        dailyTokenTrend: dailyTrends.tokens
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      return {
        totalRequests: 0,
        copyrightErrors: 0,
        uptimeSeconds: 0,
        uptime: '0 days, 0 hours, 0 minutes, 0 seconds',
        totalTokens: 0,
        avgTokensPerRequest: 0,
        last24HoursRequests: 0,
        hourlyRequests: new Array(24).fill(0),
        hourlyTokens: new Array(24).fill(0),
        dailyRequestTrend: [],
        dailyTokenTrend: []
      };
    }
  }

  /**
   * Gets token usage statistics
   */
  async getTokenUsageStats() {
    try {
      const stats = await new Promise((resolve, reject) => {
        db.get(
          `SELECT 
            SUM(total_tokens) as total_tokens,
            AVG(total_tokens) as avg_tokens_per_request,
            COUNT(*) as total_requests
          FROM api_requests`,
          function(err, row) {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      return {
        totalTokens: stats?.total_tokens || 0,
        avgTokensPerRequest: Math.round(stats?.avg_tokens_per_request || 0)
      };
    } catch (error) {
      console.error('Error getting token usage stats:', error);
      return { totalTokens: 0, avgTokensPerRequest: 0 };
    }
  }

  /**
   * Gets the number of requests in the last 24 hours
   */
  async getLast24HoursRequestsCount() {
    try {
      const result = await new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(*) as count 
           FROM api_requests 
           WHERE timestamp >= datetime('now', '-24 hours')`,
          function(err, row) {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting 24-hour request count:', error);
      return 0;
    }
  }

  /**
   * Gets hourly data for requests and tokens in the last 24 hours
   */
  async getHourlyData() {
    try {
      const hourlyRequests = new Array(24).fill(0);
      const hourlyTokens = new Array(24).fill(0);
      
      // Get hourly request counts
      const requestsData = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            strftime('%H', timestamp) as hour,
            COUNT(*) as count
           FROM api_requests 
           WHERE timestamp >= datetime('now', '-24 hours')
           GROUP BY hour`,
          function(err, rows) {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      // Get hourly token usage
      const tokensData = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            strftime('%H', timestamp) as hour,
            SUM(total_tokens) as tokens
           FROM api_requests 
           WHERE timestamp >= datetime('now', '-24 hours')
           GROUP BY hour`,
          function(err, rows) {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      // Fill in the hourly arrays
      requestsData.forEach(row => {
        const hourIndex = parseInt(row.hour, 10);
        if (!isNaN(hourIndex) && hourIndex >= 0 && hourIndex < 24) {
          hourlyRequests[hourIndex] = row.count;
        }
      });
      
      tokensData.forEach(row => {
        const hourIndex = parseInt(row.hour, 10);
        if (!isNaN(hourIndex) && hourIndex >= 0 && hourIndex < 24) {
          hourlyTokens[hourIndex] = row.tokens;
        }
      });
      
      return { hourlyRequests, hourlyTokens };
    } catch (error) {
      console.error('Error getting hourly data:', error);
      return { 
        hourlyRequests: new Array(24).fill(0),
        hourlyTokens: new Array(24).fill(0)
      };
    }
  }

  /**
   * Formats uptime in seconds to a human-readable string
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime string
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds -= days * 24 * 60 * 60;
    
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * 60 * 60;
    
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    
    // Format in Chinese with compact display
    const parts = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0 || days > 0) parts.push(`${hours}小时`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}分钟`);
    parts.push(`${seconds}秒`);
    
    return parts.join(' ');
  }

  /**
   * Gets daily API request and token usage trends for the last 30 days
   */
  async getDailyTrends() {
    try {
      // Get daily API requests from api_metrics
      const requestsData = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            date, 
            total_requests
           FROM api_metrics 
           WHERE date >= date('now', '-30 days')
           ORDER BY date ASC`,
          function(err, rows) {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      // Get daily token usage from api_requests
      const tokensData = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            date(timestamp) as date,
            SUM(total_tokens) as total_tokens
           FROM api_requests 
           WHERE timestamp >= datetime('now', '-30 days')
           GROUP BY date(timestamp)
           ORDER BY date ASC`,
          function(err, rows) {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
      
      return { 
        requests: requestsData.map(row => ({ 
          date: row.date, 
          count: row.total_requests 
        })),
        tokens: tokensData.map(row => ({ 
          date: row.date, 
          count: row.total_tokens 
        }))
      };
    } catch (error) {
      console.error('Error getting daily trends:', error);
      return { requests: [], tokens: [] };
    }
  }
}

module.exports = new MetricsService(); 