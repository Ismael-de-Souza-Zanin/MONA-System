using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ShareLinkAccessControls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowMessages",
                table: "ShareLinks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowUploads",
                table: "ShareLinks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShareContactInfo",
                table: "ShareLinks",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowMessages",
                table: "ShareLinks");

            migrationBuilder.DropColumn(
                name: "AllowUploads",
                table: "ShareLinks");

            migrationBuilder.DropColumn(
                name: "ShareContactInfo",
                table: "ShareLinks");
        }
    }
}
