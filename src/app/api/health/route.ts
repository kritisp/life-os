import { NextResponse } from 'next/server'
import { runBackendTestSuite } from '@/lib/test-suite'

export async function GET() {
  const testResults = runBackendTestSuite()
  const allPassed = testResults.every((r) => r.passed)

  return NextResponse.json({
    status: allPassed ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    tests: testResults,
  })
}
