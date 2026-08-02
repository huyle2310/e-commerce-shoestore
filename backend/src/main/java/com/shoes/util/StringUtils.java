package com.shoes.util;

public class StringUtils {
    public static int calculateLevenshteinDistance(String x, String y) {
        if (x == null || y == null) {
            throw new IllegalArgumentException("Strings must not be null");
        }
        x = x.toLowerCase();
        y = y.toLowerCase();
        
        int[][] dp = new int[x.length() + 1][y.length() + 1];

        for (int i = 0; i <= x.length(); i++) {
            for (int j = 0; j <= y.length(); j++) {
                if (i == 0) {
                    dp[i][j] = j;
                }
                else if (j == 0) {
                    dp[i][j] = i;
                }
                else {
                    dp[i][j] = Math.min(dp[i - 1][j - 1] 
                     + costOfSubstitution(x.charAt(i - 1), y.charAt(j - 1)), 
                      Math.min(dp[i - 1][j] + 1, 
                      dp[i][j - 1] + 1));
                }
            }
        }
        return dp[x.length()][y.length()];
    }

    private static int costOfSubstitution(char a, char b) {
        return a == b ? 0 : 1;
    }
}
