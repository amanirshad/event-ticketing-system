package wilp.bits_pilani.ac.in.user_service.domain.dto;

import lombok.Data;

@Data
public class UserRegistrationDto {
    private String name;
    private String email;
    private String password;
    private String phone;
}