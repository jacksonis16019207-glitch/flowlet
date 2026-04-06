package com.example.flowlet.appsetting;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AppSettingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getAppSettingsReturnsCurrentSetting() throws Exception {
        mockMvc.perform(get("/api/app-settings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.monthStartDay").isNumber())
            .andExpect(jsonPath("$.monthStartAdjustmentRule").isString());
    }

    @Test
    void putAppSettingsUpdatesMonthBoundary() throws Exception {
        mockMvc.perform(put("/api/app-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"monthStartDay":25,"monthStartAdjustmentRule":"PREVIOUS_BUSINESS_DAY"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.monthStartDay").value(25))
            .andExpect(jsonPath("$.monthStartAdjustmentRule").value("PREVIOUS_BUSINESS_DAY"));
    }

    @Test
    void putAppSettingsValidatesMonthStartDay() throws Exception {
        mockMvc.perform(put("/api/app-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"monthStartDay":0,"monthStartAdjustmentRule":"NONE"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
