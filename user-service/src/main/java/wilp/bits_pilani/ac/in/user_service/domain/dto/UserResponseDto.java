package wilp.bits_pilani.ac.in.user_service.domain.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponseDto {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private LocalDateTime createdAt;
}