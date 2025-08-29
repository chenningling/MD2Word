/**
 * 公式转换 API 路由模块
 * 职责：提供 LaTeX 公式转换的 HTTP 接口
 * 作用：接收前端的 LaTeX 公式转换请求，调用转换服务并返回 OMML 结果
 */

const express = require('express');
const { convertFormula, convertFormulas, getConversionStats, getLatexService } = require('../services/latexService');

const router = express.Router();

/**
 * 转换单个 LaTeX 公式
 * POST /api/formula/convert-single
 */
router.post('/convert-single', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('[Formula API] 接收单个公式转换请求', {
      timestamp: startTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    const { latex, isDisplayMode = false } = req.body;
    
    // 验证请求参数
    if (!latex || typeof latex !== 'string') {
      console.warn('[Formula API] 无效请求：缺少 latex 参数');
      return res.status(400).json({
        success: false,
        error: '缺少必需的 latex 参数'
      });
    }

    if (latex.length > 10000) {
      console.warn('[Formula API] 无效请求：LaTeX 代码过长', { length: latex.length });
      return res.status(400).json({
        success: false,
        error: 'LaTeX 代码长度不能超过 10000 字符'
      });
    }

    console.log('[Formula API] 开始转换', {
      latex: latex.substring(0, 50) + (latex.length > 50 ? '...' : ''),
      isDisplayMode
    });

    // 调用转换服务
    const result = await convertFormula(latex, isDisplayMode);
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log('[Formula API] 转换成功', {
        latex: latex.substring(0, 30),
        duration,
        ommlLength: result.omml ? result.omml.length : 0
      });
      
      res.json({
        success: true,
        data: {
          latex: result.latex,
          omml: result.omml,
          mathml: result.mathml,
          isDisplayMode: result.isDisplayMode,
          conversionTime: result.conversionTime
        }
      });
    } else {
      console.warn('[Formula API] 转换失败', {
        latex: latex.substring(0, 30),
        error: result.error,
        duration
      });
      
      res.status(422).json({
        success: false,
        error: result.error,
        data: {
          latex: result.latex,
          isDisplayMode: result.isDisplayMode
        }
      });
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Formula API] 请求处理异常', {
      error: error.message,
      stack: error.stack,
      duration
    });
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 批量转换多个 LaTeX 公式
 * POST /api/formula/convert
 */
router.post('/convert', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('[Formula API] 接收批量公式转换请求', {
      timestamp: startTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    const { formulas } = req.body;
    
    // 验证请求参数
    if (!Array.isArray(formulas)) {
      console.warn('[Formula API] 无效请求：formulas 不是数组');
      return res.status(400).json({
        success: false,
        error: 'formulas 参数必须是数组'
      });
    }

    if (formulas.length === 0) {
      console.warn('[Formula API] 无效请求：公式数组为空');
      return res.status(400).json({
        success: false,
        error: '公式数组不能为空'
      });
    }

    if (formulas.length > 50) {
      console.warn('[Formula API] 无效请求：公式数量过多', { count: formulas.length });
      return res.status(400).json({
        success: false,
        error: '单次最多转换 50 个公式'
      });
    }

    // 验证公式格式
    for (const formula of formulas) {
      if (!formula.id || !formula.latex || typeof formula.latex !== 'string') {
        console.warn('[Formula API] 无效公式格式', formula);
        return res.status(400).json({
          success: false,
          error: '公式格式无效，必须包含 id 和 latex 字段'
        });
      }
    }

    console.log('[Formula API] 开始批量转换', {
      count: formulas.length,
      formulas: formulas.map(f => ({
        id: f.id,
        type: f.type,
        latex: f.latex.substring(0, 30) + (f.latex.length > 30 ? '...' : '')
      }))
    });

    // 调用转换服务
    const results = await convertFormulas(formulas);
    
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    console.log('[Formula API] 批量转换完成', {
      total: results.length,
      success: successCount,
      failed: failedCount,
      duration
    });
    
    res.json({
      success: true,
      data: {
        results,
        stats: {
          total: results.length,
          success: successCount,
          failed: failedCount,
          duration
        }
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Formula API] 批量转换异常', {
      error: error.message,
      stack: error.stack,
      duration
    });
    
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

/**
 * 获取转换服务统计信息
 * GET /api/formula/stats
 */
router.get('/stats', (req, res) => {
  try {
    console.log('[Formula API] 获取统计信息请求');
    
    const stats = getConversionStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('[Formula API] 获取统计信息失败', error);
    
    res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    });
  }
});

/**
 * 测试转换服务功能
 * GET /api/formula/test
 */
router.get('/test', async (req, res) => {
  try {
    console.log('[Formula API] 接收转换功能测试请求');
    
    const service = getLatexService();
    const testResult = await service.testConversion();
    
    if (testResult) {
      console.log('[Formula API] 转换功能测试成功');
      res.json({
        success: true,
        message: '转换功能测试通过',
        data: {
          serviceReady: true,
          testPassed: true,
          stats: service.getStats(),
          supportedSyntax: service.getSupportedSyntax()
        }
      });
    } else {
      console.warn('[Formula API] 转换功能测试失败');
      res.status(503).json({
        success: false,
        error: '转换功能测试失败',
        data: {
          serviceReady: service.isInitialized,
          testPassed: false,
          stats: service.getStats()
        }
      });
    }
    
  } catch (error) {
    console.error('[Formula API] 测试请求处理异常', error);
    
    res.status(500).json({
      success: false,
      error: '测试功能异常',
      details: error.message
    });
  }
});

/**
 * 清空转换缓存
 * DELETE /api/formula/cache
 */
router.delete('/cache', (req, res) => {
  try {
    console.log('[Formula API] 清空缓存请求');
    
    const service = getLatexService();
    const oldStats = service.getStats();
    service.clearCache();
    const newStats = service.getStats();
    
    console.log('[Formula API] 缓存清空成功');
    
    res.json({
      success: true,
      message: '缓存已清空',
      data: {
        before: { cacheSize: oldStats.cacheSize },
        after: { cacheSize: newStats.cacheSize }
      }
    });
    
  } catch (error) {
    console.error('[Formula API] 清空缓存失败', error);
    
    res.status(500).json({
      success: false,
      error: '清空缓存失败'
    });
  }
});

/**
 * 获取支持的语法信息
 * GET /api/formula/syntax
 */
router.get('/syntax', (req, res) => {
  try {
    console.log('[Formula API] 获取语法信息请求');
    
    const service = getLatexService();
    const syntax = service.getSupportedSyntax();
    
    res.json({
      success: true,
      data: syntax
    });
    
  } catch (error) {
    console.error('[Formula API] 获取语法信息失败', error);
    
    res.status(500).json({
      success: false,
      error: '获取语法信息失败'
    });
  }
});

module.exports = router;
